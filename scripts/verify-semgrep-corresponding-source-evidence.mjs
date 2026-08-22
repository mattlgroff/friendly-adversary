import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";

const installedRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedArchiveRoot = "semgrep-1.172.0-friendly-adversary-source";
const fingerprintVersion = 1;
const fingerprintPrefix = `friendly-adversary-semgrep-corresponding-source-inputs-v${fingerprintVersion}\0`;
const contentTreeDefinitionVersion = 1;
const contentTreePrefix = `friendly-adversary-semgrep-corresponding-source-tree-v${contentTreeDefinitionVersion}\0`;
const metadataLimit = 16 * 1024 * 1024;
const capturedFileLimit = 4 * 1024 * 1024;
const utf8 = new TextDecoder("utf-8", { fatal: true });

class ArchiveValidationError extends Error {}

function usage() {
  return [
    "Usage:",
    "  node scripts/verify-semgrep-corresponding-source-evidence.mjs verify [--evidence PATH] [--archive PATH] [--root PATH]",
    "  node scripts/verify-semgrep-corresponding-source-evidence.mjs record --archive PATH [--output PATH] [--independent-archive PATH] [--retain-archive-path] [--root PATH]",
  ].join("\n");
}

function parseArguments(tokens) {
  const values = new Map();
  const flags = new Set();
  const valueOptions = new Set(["--archive", "--evidence", "--independent-archive", "--output", "--root"]);
  const flagOptions = new Set(["--retain-archive-path"]);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (valueOptions.has(token)) {
      if (values.has(token)) throw new Error(`${token} may be specified only once`);
      const value = tokens[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${token} requires a path`);
      values.set(token, value);
      index += 1;
    } else if (flagOptions.has(token)) {
      if (flags.has(token)) throw new Error(`${token} may be specified only once`);
      flags.add(token);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return { flags, values };
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function contentTreeAttestation(archivePath, entries) {
  const hash = createHash("sha256");
  hash.update(`${contentTreePrefix}${archivePath}\0`);
  for (const entry of entries.sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))) {
    if (entry.type === "file") {
      hash.update(`${entry.path}\0file\0${entry.bytes}\0${entry.sha256}\n`);
    } else {
      hash.update(`${entry.path}\0${entry.type}\0${entry.target}\n`);
    }
  }
  return {
    algorithm: "sha256",
    definitionVersion: contentTreeDefinitionVersion,
    entryCount: entries.length,
    sha256: hash.digest("hex"),
  };
}

async function hashFile(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

function decodeUtf8(content, label) {
  try {
    return utf8.decode(content);
  } catch {
    throw new ArchiveValidationError(`${label} is not valid UTF-8`);
  }
}

function tarString(field, label) {
  const zero = field.indexOf(0);
  return decodeUtf8(field.subarray(0, zero < 0 ? field.length : zero), label);
}

function tarNumber(field, label) {
  if ((field[0] & 0x80) !== 0) {
    if ((field[0] & 0x40) !== 0) throw new ArchiveValidationError(`${label} is negative`);
    let value = field[0] & 0x3f;
    for (const byte of field.subarray(1)) {
      value = (value * 256) + byte;
      if (!Number.isSafeInteger(value)) throw new ArchiveValidationError(`${label} exceeds the safe integer range`);
    }
    return value;
  }
  const text = field.toString("ascii").replaceAll("\0", "").trim();
  if (!text) return 0;
  if (!/^[0-7]+$/u.test(text)) throw new ArchiveValidationError(`${label} is not a valid octal number`);
  const value = Number.parseInt(text, 8);
  if (!Number.isSafeInteger(value)) throw new ArchiveValidationError(`${label} exceeds the safe integer range`);
  return value;
}

function parseHeader(header) {
  const expectedChecksum = tarNumber(header.subarray(148, 156), "tar header checksum");
  let actualChecksum = 0;
  for (let index = 0; index < header.length; index += 1) {
    actualChecksum += index >= 148 && index < 156 ? 0x20 : header[index];
  }
  if (actualChecksum !== expectedChecksum) throw new ArchiveValidationError("Tar header checksum mismatch");
  const name = tarString(header.subarray(0, 100), "tar member name");
  const prefix = tarString(header.subarray(345, 500), "tar member prefix");
  return {
    name: prefix ? `${prefix}/${name}` : name,
    linkName: tarString(header.subarray(157, 257), "tar link target"),
    size: tarNumber(header.subarray(124, 136), `size for ${name}`),
    type: header[156] === 0 ? "0" : String.fromCharCode(header[156]),
  };
}

function parsePax(content) {
  const attributes = {};
  let offset = 0;
  while (offset < content.length) {
    const space = content.indexOf(0x20, offset);
    if (space < 0) throw new ArchiveValidationError("Malformed PAX record length");
    const lengthText = content.subarray(offset, space).toString("ascii");
    if (!/^[1-9][0-9]*$/u.test(lengthText)) throw new ArchiveValidationError("Malformed PAX record length");
    const length = Number.parseInt(lengthText, 10);
    const end = offset + length;
    if (!Number.isSafeInteger(length) || end > content.length || content[end - 1] !== 0x0a) {
      throw new ArchiveValidationError("Malformed PAX record boundary");
    }
    const equals = content.indexOf(0x3d, space + 1);
    if (equals < 0 || equals >= end - 1) throw new ArchiveValidationError("Malformed PAX key/value record");
    const key = content.subarray(space + 1, equals).toString("ascii");
    if (key === "path" || key === "linkpath" || key === "size") {
      attributes[key] = decodeUtf8(content.subarray(equals + 1, end - 1), `PAX ${key}`);
    }
    offset = end;
  }
  return attributes;
}

function normalizedMemberPath(memberPath, label) {
  if (!memberPath || memberPath.includes("\\") || memberPath.includes("\0") || path.posix.isAbsolute(memberPath) || /^[A-Za-z]:/u.test(memberPath)) {
    throw new ArchiveValidationError(`${label} is not a safe relative path: ${JSON.stringify(memberPath)}`);
  }
  const withoutTrailingSlash = memberPath.endsWith("/") ? memberPath.slice(0, -1) : memberPath;
  if (!withoutTrailingSlash || withoutTrailingSlash.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new ArchiveValidationError(`${label} is not normalized: ${JSON.stringify(memberPath)}`);
  }
  if (path.posix.normalize(withoutTrailingSlash) !== withoutTrailingSlash) {
    throw new ArchiveValidationError(`${label} is not normalized: ${JSON.stringify(memberPath)}`);
  }
  return withoutTrailingSlash;
}

function validateLinkTarget(memberPath, linkName, type, archiveRoot) {
  if (type !== "1" && type !== "2") return;
  if (!linkName || linkName.includes("\\") || linkName.includes("\0") || path.posix.isAbsolute(linkName) || /^[A-Za-z]:/u.test(linkName)) {
    throw new ArchiveValidationError(`${memberPath} has an unsafe link target: ${JSON.stringify(linkName)}`);
  }
  const resolved = type === "2"
    ? path.posix.normalize(path.posix.join(path.posix.dirname(memberPath), linkName))
    : path.posix.normalize(linkName);
  if (resolved !== archiveRoot && !resolved.startsWith(`${archiveRoot}/`)) {
    throw new ArchiveValidationError(`${memberPath} link target escapes ${archiveRoot}: ${JSON.stringify(linkName)}`);
  }
}

class ChunkReader {
  constructor(stream) {
    this.iterator = stream[Symbol.asyncIterator]();
    this.buffer = Buffer.alloc(0);
    this.done = false;
  }

  async fill() {
    if (this.buffer.length > 0 || this.done) return;
    const next = await this.iterator.next();
    if (next.done) {
      this.done = true;
    } else {
      this.buffer = Buffer.from(next.value);
    }
  }

  async take(maximum) {
    await this.fill();
    if (this.buffer.length === 0) return undefined;
    const size = Math.min(maximum, this.buffer.length);
    const result = this.buffer.subarray(0, size);
    this.buffer = this.buffer.subarray(size);
    return result;
  }

  async readExactly(size, label) {
    const chunks = [];
    let remaining = size;
    while (remaining > 0) {
      const chunk = await this.take(remaining);
      if (!chunk) throw new ArchiveValidationError(`Unexpected end of archive while reading ${label}`);
      chunks.push(chunk);
      remaining -= chunk.length;
    }
    return chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, size);
  }

  async consume(size, onChunk) {
    let remaining = size;
    while (remaining > 0) {
      const chunk = await this.take(remaining);
      if (!chunk) throw new ArchiveValidationError("Unexpected end of archive member data");
      if (onChunk) onChunk(chunk);
      remaining -= chunk.length;
    }
  }

  async requireOnlyZeros() {
    while (true) {
      const chunk = await this.take(64 * 1024);
      if (!chunk) return;
      if (chunk.some((byte) => byte !== 0)) throw new ArchiveValidationError("Non-zero data follows the tar end marker");
    }
  }
}

async function walkRegularFiles(root, relativeDirectory) {
  const absoluteDirectory = path.join(root, ...relativeDirectory.split("/"));
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile()) {
        files.push(path.relative(root, absolute).split(path.sep).join("/"));
      } else {
        throw new Error(`${path.relative(root, absolute)} must be a regular file`);
      }
    }
  }
  await visit(absoluteDirectory);
  return files.sort();
}

function validateManifestPath(value, label) {
  return normalizedMemberPath(value, label);
}

function snapshotIdentity(metadata) {
  return [metadata.dev, metadata.ino, metadata.mode, metadata.size, metadata.mtimeNs, metadata.ctimeNs].join(":");
}

async function readSnapshotFile(root, relative, snapshots) {
  const existing = snapshots.get(relative);
  if (existing) return existing;
  const absolute = path.join(root, ...relative.split("/"));
  const before = await lstat(absolute, { bigint: true });
  if (!before.isFile() || before.isSymbolicLink()) throw new ArchiveValidationError(`${relative} must be a regular file`);
  const content = await readFile(absolute);
  const after = await lstat(absolute, { bigint: true });
  const identity = snapshotIdentity(before);
  if (identity !== snapshotIdentity(after) || BigInt(content.byteLength) !== after.size) {
    throw new ArchiveValidationError(`Repository input changed while being read: ${relative}`);
  }
  const snapshot = { bytes: content.byteLength, content, identity, sha256: sha256(content) };
  snapshots.set(relative, snapshot);
  return snapshot;
}

async function assertContractInputsStable(contract) {
  for (const [relative, expected] of contract.inputSnapshots) {
    const absolute = path.join(contract.root, ...relative.split("/"));
    const before = await lstat(absolute, { bigint: true }).catch(() => undefined);
    if (!before?.isFile() || before.isSymbolicLink()) {
      throw new ArchiveValidationError(`Repository input changed before evidence publication: ${relative}`);
    }
    const content = await readFile(absolute);
    const after = await lstat(absolute, { bigint: true }).catch(() => undefined);
    if (!after?.isFile()
      || snapshotIdentity(before) !== snapshotIdentity(after)
      || snapshotIdentity(after) !== expected.identity
      || content.byteLength !== expected.bytes
      || sha256(content) !== expected.sha256) {
      throw new ArchiveValidationError(`Repository input changed before evidence publication: ${relative}`);
    }
  }
  for (const [directory, expectedFiles] of contract.repositoryDirectorySnapshots) {
    const actualFiles = await walkRegularFiles(contract.root, directory);
    if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
      throw new ArchiveValidationError(`Repository input directory changed before evidence publication: ${directory}`);
    }
  }
}

async function loadContract(root) {
  const manifestRelative = "engines/semgrep-wasm/source/corresponding-source-manifest.json";
  const lockRelative = "engines/semgrep-wasm/upstream-lock.json";
  const linkedRelative = "engines/semgrep-wasm/source/linked-components.json";
  const inputSnapshots = new Map();
  const manifest = JSON.parse(decodeUtf8((await readSnapshotFile(root, manifestRelative, inputSnapshots)).content, manifestRelative));
  const lock = JSON.parse(decodeUtf8((await readSnapshotFile(root, lockRelative, inputSnapshots)).content, lockRelative));
  const linked = JSON.parse(decodeUtf8((await readSnapshotFile(root, linkedRelative, inputSnapshots)).content, linkedRelative));
  if (manifest.schemaVersion !== 1) throw new Error("Corresponding-source manifest must use schemaVersion 1");
  if (manifest.archiveRoot !== expectedArchiveRoot) throw new Error(`Corresponding-source manifest root must be ${expectedArchiveRoot}`);
  if (!Number.isSafeInteger(manifest.opamPackageCount) || manifest.opamPackageCount <= 0) throw new Error("Manifest opamPackageCount must be positive");
  if (!Array.isArray(linked.linkedOcamlPackages) || linked.linkedOcamlPackages.length !== manifest.opamPackageCount) {
    throw new Error(`Linked OPAM inventory must contain exactly ${manifest.opamPackageCount} packages`);
  }

  const opamPrefixes = new Set();
  for (const component of linked.linkedOcamlPackages) {
    const prefix = validateManifestPath(`opam-sources/${component.name}-${component.version}`, `OPAM prefix for ${component.name}`);
    if (opamPrefixes.has(prefix)) throw new Error(`Duplicate OPAM source prefix: ${prefix}`);
    opamPrefixes.add(prefix);
  }
  const submodulePrefixes = new Set();
  for (const submodule of lock.requiredSubmodules ?? []) {
    const prefix = validateManifestPath(`semgrep/${submodule.path}`, `submodule prefix for ${submodule.path}`);
    if (submodulePrefixes.has(prefix)) throw new Error(`Duplicate required submodule prefix: ${prefix}`);
    submodulePrefixes.add(prefix);
  }

  const expectedContentTreePaths = ["semgrep", "opam-sources"];
  if (!Array.isArray(manifest.contentTrees)
    || JSON.stringify(manifest.contentTrees.map((entry) => entry.archivePath)) !== JSON.stringify(expectedContentTreePaths)) {
    throw new Error(`Corresponding-source manifest contentTrees must be exactly ${expectedContentTreePaths.join(", ")}`);
  }
  const contentTrees = manifest.contentTrees.map((entry) => {
    const archivePath = validateManifestPath(entry.archivePath, "content tree archive path");
    if (entry.algorithm !== "sha256") throw new Error(`${archivePath} content tree algorithm must be sha256`);
    if (entry.definitionVersion !== contentTreeDefinitionVersion) {
      throw new Error(`${archivePath} content tree must use definitionVersion ${contentTreeDefinitionVersion}`);
    }
    if (!Number.isSafeInteger(entry.entryCount) || entry.entryCount <= 0) {
      throw new Error(`${archivePath} content tree entryCount must be a positive safe integer`);
    }
    if (!/^[a-f0-9]{64}$/u.test(entry.sha256 ?? "")) {
      throw new Error(`${archivePath} content tree sha256 must be a lowercase SHA-256 digest`);
    }
    return { algorithm: entry.algorithm, archivePath, definitionVersion: entry.definitionVersion, entryCount: entry.entryCount, sha256: entry.sha256 };
  });

  const repositoryMembers = new Map();
  const repositoryDirectorySnapshots = new Map();
  const inputFiles = new Set([manifestRelative, lockRelative, linkedRelative]);
  const addRepositoryFile = async (sourcePath, archivePath) => {
    const normalizedSource = validateManifestPath(sourcePath, "repository source path");
    const normalizedArchive = validateManifestPath(archivePath, "repository archive path");
    const snapshot = await readSnapshotFile(root, normalizedSource, inputSnapshots);
    const member = `${manifest.archiveRoot}/${normalizedArchive}`;
    if (repositoryMembers.has(member)) throw new Error(`Duplicate repository-controlled archive path: ${normalizedArchive}`);
    repositoryMembers.set(member, { sourcePath: normalizedSource, bytes: snapshot.bytes, sha256: snapshot.sha256 });
    inputFiles.add(normalizedSource);
  };

  for (const entry of manifest.repositoryFiles ?? []) await addRepositoryFile(entry.sourcePath, entry.archivePath);
  for (const entry of manifest.repositoryDirectories ?? []) {
    const sourceDirectory = validateManifestPath(entry.sourcePath, "repository source directory");
    const archiveDirectory = validateManifestPath(entry.archivePath, "repository archive directory");
    const sourcePaths = await walkRegularFiles(root, sourceDirectory);
    repositoryDirectorySnapshots.set(sourceDirectory, sourcePaths);
    for (const sourcePath of sourcePaths) {
      const relative = path.posix.relative(sourceDirectory, sourcePath);
      await addRepositoryFile(sourcePath, `${archiveDirectory}/${relative}`);
    }
  }
  for (const sourcePath of manifest.fingerprintFiles ?? []) {
    const normalized = validateManifestPath(sourcePath, "fingerprint file");
    await readSnapshotFile(root, normalized, inputSnapshots);
    inputFiles.add(normalized);
  }
  const inputManifest = [];
  for (const relative of [...inputFiles].sort()) {
    const snapshot = await readSnapshotFile(root, relative, inputSnapshots);
    inputManifest.push({ path: relative, bytes: snapshot.bytes, sha256: snapshot.sha256 });
  }
  const canonical = inputManifest.map((entry) => `${entry.path}\0${entry.bytes}\0${entry.sha256}\n`).join("");
  const sourceInputs = {
    algorithm: "sha256",
    definitionVersion: fingerprintVersion,
    fileCount: inputManifest.length,
    fingerprint: sha256(`${fingerprintPrefix}${canonical}`),
  };

  const digestMembers = new Map(repositoryMembers);
  for (const entry of manifest.semgrepFiles ?? []) {
    const member = `${manifest.archiveRoot}/${validateManifestPath(entry.archivePath, "Semgrep archive path")}`;
    digestMembers.set(member, { sha256: entry.sha256, kind: "Semgrep" });
  }
  const externalMembers = new Set();
  for (const entry of manifest.externalSources ?? []) {
    const relative = validateManifestPath(entry.archivePath, "external source archive path");
    if (!relative.startsWith("external-sources/")) throw new Error(`${relative} must be under external-sources`);
    const member = `${manifest.archiveRoot}/${relative}`;
    if (externalMembers.has(member)) throw new Error(`Duplicate external source member: ${relative}`);
    externalMembers.add(member);
    digestMembers.set(member, { sha256: entry.sha256, kind: "external source" });
  }

  const patches = {};
  for (const patchPath of manifest.sourceBundlePatchFiles ?? []) {
    const normalized = validateManifestPath(patchPath, "source bundle patch path");
    const snapshot = await readSnapshotFile(root, normalized, inputSnapshots);
    patches[path.posix.basename(normalized)] = snapshot.sha256;
  }
  return { contentTrees, digestMembers, externalMembers, inputSnapshots, linked, lock, manifest, opamPrefixes, patches, repositoryDirectorySnapshots, repositoryMembers, root, sourceInputs, submodulePrefixes };
}

async function scanTarArchive(archive, contract) {
  const stream = createReadStream(archive).pipe(createGunzip());
  const reader = new ChunkReader(stream);
  const seen = new Map();
  const digests = new Map();
  const captures = new Map();
  const opamWithContent = new Set();
  const submodulesWithContent = new Set();
  const contentTreeEntries = new Map(contract.contentTrees.map((tree) => [tree.archivePath, []]));
  let globalPax = {};
  let localPax = {};
  let longName;
  let longLink;
  let zeroBlocks = 0;
  let entries = 0;
  let rootDirectorySeen = false;

  while (true) {
    const header = await reader.readExactly(512, "tar header");
    if (header.every((byte) => byte === 0)) {
      zeroBlocks += 1;
      if (zeroBlocks === 2) {
        await reader.requireOnlyZeros();
        break;
      }
      continue;
    }
    if (zeroBlocks > 0) throw new ArchiveValidationError("A non-zero tar header follows an end marker");
    const parsed = parseHeader(header);
    const metadataType = new Set(["g", "x", "L", "K"]).has(parsed.type);
    if (metadataType) {
      if (parsed.size > metadataLimit) throw new ArchiveValidationError(`Tar metadata entry exceeds ${metadataLimit} bytes`);
      const content = await reader.readExactly(parsed.size, "tar metadata");
      await reader.consume((512 - (parsed.size % 512)) % 512);
      if (parsed.type === "g") globalPax = { ...globalPax, ...parsePax(content) };
      else if (parsed.type === "x") localPax = parsePax(content);
      else if (parsed.type === "L") longName = decodeUtf8(content.subarray(0, content.indexOf(0) < 0 ? content.length : content.indexOf(0)), "GNU long member name");
      else longLink = decodeUtf8(content.subarray(0, content.indexOf(0) < 0 ? content.length : content.indexOf(0)), "GNU long link target");
      continue;
    }

    const attributes = { ...globalPax, ...localPax };
    const effectiveName = attributes.path ?? longName ?? parsed.name;
    const effectiveLink = attributes.linkpath ?? longLink ?? parsed.linkName;
    if (attributes.size !== undefined && !/^(0|[1-9][0-9]*)$/u.test(attributes.size)) {
      throw new ArchiveValidationError(`${effectiveName} has an invalid PAX size`);
    }
    const effectiveSize = attributes.size === undefined ? parsed.size : Number(attributes.size);
    localPax = {};
    longName = undefined;
    longLink = undefined;
    if (!Number.isSafeInteger(effectiveSize) || effectiveSize < 0) throw new ArchiveValidationError(`${effectiveName} has an invalid PAX size`);
    if (!new Set(["0", "1", "2", "5"]).has(parsed.type)) throw new ArchiveValidationError(`${effectiveName} has unsupported tar type ${JSON.stringify(parsed.type)}`);

    const member = normalizedMemberPath(effectiveName, "tar member path");
    validateLinkTarget(member, effectiveLink, parsed.type, contract.manifest.archiveRoot);
    if (member !== contract.manifest.archiveRoot && !member.startsWith(`${contract.manifest.archiveRoot}/`)) {
      throw new ArchiveValidationError(`Archive member is outside the exact ${contract.manifest.archiveRoot} root: ${member}`);
    }
    if (seen.has(member)) throw new ArchiveValidationError(`Duplicate tar member path: ${member}`);
    seen.set(member, parsed.type);
    entries += 1;
    if (member === contract.manifest.archiveRoot) {
      if (parsed.type !== "5") throw new ArchiveValidationError(`${member} must be the archive root directory`);
      rootDirectorySeen = true;
    }

    const relative = member === contract.manifest.archiveRoot ? "" : member.slice(contract.manifest.archiveRoot.length + 1);
    const contentTree = contract.contentTrees.find((tree) => relative.startsWith(`${tree.archivePath}/`));
    if (relative.startsWith("external-sources/") && relative !== "external-sources") {
      if (!contract.externalMembers.has(member)) throw new ArchiveValidationError(`Unexpected external source member: ${relative}`);
      if (parsed.type !== "0") throw new ArchiveValidationError(`${relative} must be a regular file`);
    }
    if (relative.startsWith("friendly-adversary/") && parsed.type !== "5" && !contract.repositoryMembers.has(member)) {
      throw new ArchiveValidationError(`Unexpected repository-controlled bundle member: ${relative}`);
    }
    if (relative.startsWith("opam-sources/")) {
      const parts = relative.split("/");
      if (parts.length > 1 && parts[1]) {
        const prefix = `opam-sources/${parts[1]}`;
        if (!contract.opamPrefixes.has(prefix)) throw new ArchiveValidationError(`Unexpected OPAM source prefix: ${prefix}`);
        if (parts.length > 2) opamWithContent.add(prefix);
      }
    }
    for (const prefix of contract.submodulePrefixes) {
      if (relative.startsWith(`${prefix}/`)) submodulesWithContent.add(prefix);
    }

    const wanted = contract.digestMembers.get(member);
    const capture = member === `${contract.manifest.archiveRoot}/SOURCE-BUNDLE.json`
      || member === `${contract.manifest.archiveRoot}/semgrep/LICENSE`
      || member === `${contract.manifest.archiveRoot}/semgrep/semgrep.opam`;
    if ((wanted || capture) && parsed.type !== "0") throw new ArchiveValidationError(`${relative} must be a regular file`);
    if (capture && effectiveSize > capturedFileLimit) throw new ArchiveValidationError(`${relative} exceeds the capture limit`);
    if (contentTree && (parsed.type === "1" || parsed.type === "2") && effectiveSize !== 0) {
      throw new ArchiveValidationError(`${relative} link entries must not contain member data`);
    }
    const hasher = wanted || (contentTree && parsed.type === "0") ? createHash("sha256") : undefined;
    const chunks = capture ? [] : undefined;
    await reader.consume(effectiveSize, (chunk) => {
      hasher?.update(chunk);
      chunks?.push(chunk);
    });
    await reader.consume((512 - (effectiveSize % 512)) % 512);
    const memberDigest = hasher?.digest("hex");
    if (wanted && memberDigest) digests.set(member, memberDigest);
    if (contentTree && parsed.type === "0" && memberDigest) {
      contentTreeEntries.get(contentTree.archivePath).push({
        path: relative,
        type: "file",
        bytes: effectiveSize,
        sha256: memberDigest,
      });
    } else if (contentTree && (parsed.type === "1" || parsed.type === "2")) {
      contentTreeEntries.get(contentTree.archivePath).push({
        path: relative,
        type: parsed.type === "1" ? "hardlink" : "symlink",
        target: effectiveLink,
      });
    }
    if (chunks) captures.set(member, Buffer.concat(chunks, effectiveSize));
  }

  if (!rootDirectorySeen) throw new ArchiveValidationError(`Archive is missing the exact ${contract.manifest.archiveRoot} root directory`);
  const errors = [];
  for (const [member, expected] of contract.digestMembers) {
    const relative = member.slice(contract.manifest.archiveRoot.length + 1);
    if (!seen.has(member)) errors.push(`Missing required archive member: ${relative}`);
    else if (digests.get(member) !== expected.sha256) errors.push(`${relative} does not match its trusted SHA-256`);
  }
  for (const prefix of contract.opamPrefixes) if (!opamWithContent.has(prefix)) errors.push(`Missing OPAM source content: ${prefix}`);
  for (const prefix of contract.submodulePrefixes) if (!submodulesWithContent.has(prefix)) errors.push(`Missing required submodule content: ${prefix}`);
  for (const expected of contract.contentTrees) {
    const actual = contentTreeAttestation(expected.archivePath, contentTreeEntries.get(expected.archivePath));
    if (actual.entryCount !== expected.entryCount || actual.sha256 !== expected.sha256) {
      errors.push(`${expected.archivePath} content tree is ${actual.entryCount} entries with SHA-256 ${actual.sha256}, expected ${expected.entryCount} entries with SHA-256 ${expected.sha256}`);
    }
  }

  const sourceBundleMember = `${contract.manifest.archiveRoot}/SOURCE-BUNDLE.json`;
  const sourceBundleContent = captures.get(sourceBundleMember);
  if (!sourceBundleContent) {
    errors.push("Missing SOURCE-BUNDLE.json");
  } else {
    try {
      const sourceBundle = JSON.parse(decodeUtf8(sourceBundleContent, "SOURCE-BUNDLE.json"));
      const expectedFields = {
        schemaVersion: 1,
        semgrepVersion: contract.lock.tag.replace(/^v/u, ""),
        semgrepCommit: contract.lock.commit,
        sourceDateEpoch: contract.manifest.sourceDateEpoch,
        distributionLicense: "GPL-3.0-only",
        releaseScope: "public",
        publicSourceOffer: "https://github.com/mattlgroff/friendly-adversary/releases/download/v3.0.4/semgrep-1.172.0-friendly-adversary-corresponding-source.tar.gz",
        publicPublicationBlocked: false,
      };
      for (const [field, expected] of Object.entries(expectedFields)) {
        if (sourceBundle[field] !== expected) errors.push(`SOURCE-BUNDLE.json ${field} is ${JSON.stringify(sourceBundle[field])}, expected ${JSON.stringify(expected)}`);
      }
      const actualPatchNames = Object.keys(sourceBundle.patches ?? {}).sort();
      const expectedPatchNames = Object.keys(contract.patches).sort();
      if (JSON.stringify(actualPatchNames) !== JSON.stringify(expectedPatchNames)
        || expectedPatchNames.some((name) => sourceBundle.patches[name] !== contract.patches[name])) {
        errors.push("SOURCE-BUNDLE.json patch digests do not match trusted repository patches");
      }
    } catch (error) {
      errors.push(`SOURCE-BUNDLE.json is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const license = captures.get(`${contract.manifest.archiveRoot}/semgrep/LICENSE`);
  if (license && (!decodeUtf8(license, "Semgrep LICENSE").includes("GNU LESSER GENERAL PUBLIC LICENSE") || !decodeUtf8(license, "Semgrep LICENSE").includes("Version 2.1"))) {
    errors.push("Semgrep LICENSE is not the expected LGPL 2.1 text");
  }
  const opam = captures.get(`${contract.manifest.archiveRoot}/semgrep/semgrep.opam`);
  if (opam && !/^license:\s*"LGPL-2\.1-only"\s*$/mu.test(decodeUtf8(opam, "semgrep.opam"))) {
    errors.push("semgrep.opam does not declare LGPL-2.1-only");
  }
  if (errors.length > 0) throw new ArchiveValidationError(errors.join("\n"));
  return { entries };
}

async function inspectArchive(archive, contract) {
  const absolute = path.resolve(archive);
  const metadata = await stat(absolute);
  if (!metadata.isFile()) throw new ArchiveValidationError(`Archive is not a regular file: ${absolute}`);
  const [{ entries }, digest] = await Promise.all([scanTarArchive(absolute, contract), hashFile(absolute)]);
  return { bytes: metadata.size, sha256: digest, entries };
}

async function baseEvidence(archive, contract) {
  return {
    schemaVersion: 2,
    semgrepVersion: contract.lock.tag.replace(/^v/u, ""),
    semgrepCommit: contract.lock.commit,
    archive: await inspectArchive(archive, contract),
    sourceInputs: contract.sourceInputs,
    distributionLicense: "GPL-3.0-only",
    releaseScope: "public",
    publicSourceOffer: "https://github.com/mattlgroff/friendly-adversary/releases/download/v3.0.4/semgrep-1.172.0-friendly-adversary-corresponding-source.tar.gz",
    publicPublicationBlocked: false,
    releaseStatus: "public-release-ready",
  };
}

async function writeJsonAtomically(output, value, beforePublish) {
  const absolute = path.resolve(output);
  const temporary = `${absolute}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
    if (beforePublish) await beforePublish();
    await rename(temporary, absolute);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

function compareValue(errors, label, actual, expected) {
  if (actual !== expected) errors.push(`${label} is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

function compareJsonValue(errors, label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${label} does not match the retained evidence`);
  }
}

async function completedPublication(archive) {
  const completionPath = `${archive}.complete.json`;
  const sidecarPath = `${archive}.evidence.json`;
  const regularFile = async (file, label) => {
    const metadata = await lstat(file).catch(() => undefined);
    if (!metadata?.isFile() || metadata.isSymbolicLink()) {
      throw new ArchiveValidationError(`Completed publication is missing its regular ${label}: ${file}`);
    }
    return metadata;
  };
  const [archiveMetadata, sidecarMetadata] = await Promise.all([
    regularFile(archive, "archive"),
    regularFile(sidecarPath, "evidence sidecar"),
    regularFile(completionPath, "completion marker"),
  ]);
  let completion;
  let sidecarEvidence;
  try {
    completion = JSON.parse(await readFile(completionPath, "utf8"));
    sidecarEvidence = JSON.parse(await readFile(sidecarPath, "utf8"));
  } catch (error) {
    throw new ArchiveValidationError(`Completed publication metadata is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (completion.schemaVersion !== 1 || completion.status !== "complete") {
    throw new ArchiveValidationError("Corresponding-source completion marker is invalid");
  }
  const evidenceDigest = await hashFile(sidecarPath);
  if (completion.archive?.filename !== path.basename(archive)
    || completion.archive?.bytes !== archiveMetadata.size
    || !/^[a-f0-9]{64}$/u.test(completion.archive?.sha256 ?? "")
    || completion.evidence?.filename !== path.basename(sidecarPath)
    || completion.evidence?.bytes !== sidecarMetadata.size
    || completion.evidence?.sha256 !== evidenceDigest) {
    throw new ArchiveValidationError("Corresponding-source completion marker does not match its published files");
  }
  return { completion, sidecarEvidence };
}

async function record(options, root) {
  const archiveArgument = options.values.get("--archive");
  if (!archiveArgument) throw new Error("record requires --archive PATH");
  const archive = path.resolve(archiveArgument);
  const contract = await loadContract(root);
  const evidence = await baseEvidence(archive, contract);
  const independent = options.values.get("--independent-archive");
  if (independent) {
    const reproduction = await inspectArchive(independent, contract);
    for (const property of ["bytes", "sha256", "entries"]) {
      if (reproduction[property] !== evidence.archive[property]) throw new ArchiveValidationError(`Independent archive ${property} does not match the primary archive`);
    }
    evidence.archive.independentReproduction = reproduction;
  }
  if (options.flags.has("--retain-archive-path")) {
    evidence.archive.filename = path.basename(archive);
    evidence.archive.localBuildPath = archive;
  }
  const output = options.values.get("--output") ?? `${archive}.evidence.json`;
  await writeJsonAtomically(output, evidence, () => assertContractInputsStable(contract));
  process.stdout.write(`${JSON.stringify({ status: "recorded", output: path.resolve(output), archive: evidence.archive, sourceInputs: evidence.sourceInputs }, null, 2)}\n`);
}

async function verify(options, root) {
  if (options.flags.size > 0 || options.values.has("--output") || options.values.has("--independent-archive")) {
    throw new Error("verify accepts only --evidence PATH, --archive PATH, and --root PATH");
  }
  const contract = await loadContract(root);
  const explicitArchiveArgument = options.values.get("--archive");
  const explicitArchive = explicitArchiveArgument ? path.resolve(explicitArchiveArgument) : undefined;
  const evidencePath = path.resolve(options.values.get("--evidence")
    ?? (explicitArchive ? `${explicitArchive}.evidence.json` : path.join(root, "engines", "semgrep-wasm", "evidence", "corresponding-source.json")));
  const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
  const errors = [];
  compareValue(errors, "schemaVersion", evidence.schemaVersion, 2);
  compareValue(errors, "distributionLicense", evidence.distributionLicense, "GPL-3.0-only");
  compareValue(errors, "releaseScope", evidence.releaseScope, "public");
  compareValue(errors, "publicSourceOffer", evidence.publicSourceOffer, "https://github.com/mattlgroff/friendly-adversary/releases/download/v3.0.4/semgrep-1.172.0-friendly-adversary-corresponding-source.tar.gz");
  compareValue(errors, "publicPublicationBlocked", evidence.publicPublicationBlocked, false);
  compareValue(errors, "releaseStatus", evidence.releaseStatus, "public-release-ready");
  compareValue(errors, "semgrepVersion", evidence.semgrepVersion, contract.lock.tag.replace(/^v/u, ""));
  compareValue(errors, "semgrepCommit", evidence.semgrepCommit, contract.lock.commit);
  if (!Number.isSafeInteger(evidence.archive?.bytes) || evidence.archive.bytes <= 0) errors.push("archive.bytes must be a positive safe integer");
  if (!Number.isSafeInteger(evidence.archive?.entries) || evidence.archive.entries <= 0) errors.push("archive.entries must be a positive safe integer");
  if (!/^[a-f0-9]{64}$/u.test(evidence.archive?.sha256 ?? "")) errors.push("archive.sha256 must be a lowercase SHA-256 digest");
  for (const property of ["algorithm", "definitionVersion", "fileCount", "fingerprint"]) {
    compareValue(errors, `sourceInputs.${property}`, evidence.sourceInputs?.[property], contract.sourceInputs[property]);
  }

  let archive;
  if (explicitArchive) {
    archive = explicitArchive;
  } else if (evidence.archive?.localBuildPath) {
    const candidate = path.resolve(evidence.archive.localBuildPath);
    const [candidateMetadata, completionMetadata] = await Promise.all([candidate, `${candidate}.complete.json`].map((file) => stat(file).catch((error) => {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return undefined;
      throw error;
    })));
    if (candidateMetadata && completionMetadata) archive = candidate;
  }

  let archiveVerified = false;
  if (archive) {
    try {
      const publication = await completedPublication(archive);
      const actual = await inspectArchive(archive, contract);
      for (const property of ["bytes", "sha256", "entries"]) compareValue(errors, `archive.${property}`, evidence.archive?.[property], actual[property]);
      for (const property of ["bytes", "sha256"]) compareValue(errors, `completion.archive.${property}`, publication.completion.archive?.[property], actual[property]);
      for (const property of ["bytes", "sha256", "entries"]) compareValue(errors, `sidecar.archive.${property}`, publication.sidecarEvidence.archive?.[property], evidence.archive?.[property]);
      for (const property of ["schemaVersion", "semgrepVersion", "semgrepCommit", "distributionLicense", "releaseScope", "publicSourceOffer", "publicPublicationBlocked", "releaseStatus"]) {
        compareValue(errors, `sidecar.${property}`, publication.sidecarEvidence[property], evidence[property]);
      }
      compareJsonValue(errors, "sidecar.sourceInputs", publication.sidecarEvidence.sourceInputs, evidence.sourceInputs);
      archiveVerified = errors.length === 0;
    } catch (error) {
      errors.push(`archive content validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const reproduction = evidence.archive?.independentReproduction;
  if (reproduction) {
    for (const property of ["bytes", "sha256", "entries"]) compareValue(errors, `archive.independentReproduction.${property}`, reproduction[property], evidence.archive?.[property]);
  }
  await assertContractInputsStable(contract);
  if (errors.length > 0) {
    process.stderr.write(`Corresponding-source evidence verification failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`${JSON.stringify({
    status: archiveVerified ? "verified" : "evidence-current",
    evidence: evidencePath,
    sourceInputs: contract.sourceInputs,
    archiveVerification: archiveVerified ? { status: "verified", path: archive } : { status: "not-present" },
    publicPublicationBlocked: false,
  }, null, 2)}\n`);
}

const mode = process.argv[2];
try {
  if (mode !== "record" && mode !== "verify") throw new Error(usage());
  const options = parseArguments(process.argv.slice(3));
  const root = path.resolve(options.values.get("--root") ?? installedRoot);
  if (mode === "record") await record(options, root);
  else await verify(options, root);
} catch (error) {
  if (error instanceof ArchiveValidationError) {
    process.stderr.write(`Corresponding-source archive validation failed:\n${error.message.split("\n").map((line) => `- ${line}`).join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n${usage()}\n`);
    process.exitCode = 2;
  }
}
