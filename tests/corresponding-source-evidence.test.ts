import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { gzipSync } from "node:zlib";

const repositoryRoot = process.cwd();
const verifier = path.join(repositoryRoot, "scripts", "verify-semgrep-corresponding-source-evidence.mjs");
const archiveRoot = "semgrep-1.172.0-friendly-adversary-source";

function sha256(content: string | Buffer) {
  return createHash("sha256").update(content).digest("hex");
}

function contentTree(archivePath: string, files: Array<{ path: string; content: string | Buffer }>) {
  const hash = createHash("sha256");
  hash.update(`friendly-adversary-semgrep-corresponding-source-tree-v1\0${archivePath}\0`);
  const sorted = [...files].sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
  for (const file of sorted) {
    const bytes = Buffer.byteLength(file.content);
    hash.update(`${file.path}\0file\0${bytes}\0${sha256(file.content)}\n`);
  }
  return {
    archivePath,
    algorithm: "sha256",
    definitionVersion: 1,
    entryCount: files.length,
    sha256: hash.digest("hex"),
  };
}

function createArchive(archive: string, parent: string, member: string) {
  execFileSync("tar", ["-czf", archive, "-C", parent, member], {
    env: { ...process.env, COPYFILE_DISABLE: "1" },
  });
}

async function write(root: string, relative: string, content: string | Buffer) {
  const output = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, content);
}

interface FixtureOptions {
  archiveControlledText?: string;
  archiveExternalText?: string;
  archiveOpamText?: string;
  archiveSemgrepText?: string;
  omitSubmodule?: boolean;
  omitSecondOpamPackage?: boolean;
  publicPublicationBlocked?: boolean;
}

function octal(value: number, width: number) {
  return `${value.toString(8).padStart(width - 1, "0")}\0`;
}

async function writeSingleMemberTarGz(archive: string, member: string, content: string) {
  const header = Buffer.alloc(512);
  header.write(member, 0, 100, "utf8");
  header.write(octal(0o644, 8), 100, 8, "ascii");
  header.write(octal(0, 8), 108, 8, "ascii");
  header.write(octal(0, 8), 116, 8, "ascii");
  header.write(octal(Buffer.byteLength(content), 12), 124, 12, "ascii");
  header.write(octal(0, 12), 136, 12, "ascii");
  header.fill(0x20, 148, 156);
  header[156] = "0".charCodeAt(0);
  header.write("ustar\0", 257, 6, "ascii");
  let checksum = 0;
  for (const byte of header) checksum += byte;
  header.write(`${checksum.toString(8).padStart(6, "0")}\0 `, 148, 8, "ascii");
  const body = Buffer.from(content);
  const padding = Buffer.alloc((512 - (body.length % 512)) % 512);
  await writeFile(archive, gzipSync(Buffer.concat([header, body, padding, Buffer.alloc(1024)])));
}

async function fixture(options: FixtureOptions = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-source-evidence-"));
  const root = path.join(directory, "repository");
  const staging = path.join(directory, "staging");
  const bundle = path.join(staging, archiveRoot);
  const manifestPath = "engines/semgrep-wasm/source/corresponding-source-manifest.json";
  const controlledPath = "fixture/controlled.txt";
  const controlledText = "trusted repository input\n";
  const externalText = "pinned external source\n";
  const semgrepLicense = "GNU LESSER GENERAL PUBLIC LICENSE\nVersion 2.1\n";
  const semgrepOpam = "opam-version: \"2.0\"\nlicense: \"LGPL-2.1-only\"\n";
  const semgrepSource = "let core = true\n";
  const parserSource = "let parser = true\n";
  const alphaSource = "let alpha = true\n";
  const betaSource = "let beta = true\n";
  const lock = {
    tag: "v1.172.0",
    commit: "651f37efa397bf066e1cf627414eeabe40b07e27",
    requiredSubmodules: [{ path: "vendor/parser", commit: "a".repeat(40) }],
  };
  const linked = {
    linkedOcamlPackages: [
      { name: "alpha", version: "1.0.0" },
      { name: "beta", version: "2.0.0" },
    ],
  };
  const manifest = {
    schemaVersion: 1,
    archiveRoot,
    sourceDateEpoch: 1786147200,
    opamPackageCount: 2,
    contentTrees: [
      contentTree("semgrep", [
        { path: "semgrep/LICENSE", content: semgrepLicense },
        { path: "semgrep/semgrep.opam", content: semgrepOpam },
        { path: "semgrep/src/core.ml", content: semgrepSource },
        { path: "semgrep/vendor/parser/parser.ml", content: parserSource },
      ]),
      contentTree("opam-sources", [
        { path: "opam-sources/alpha-1.0.0/source.ml", content: alphaSource },
        { path: "opam-sources/beta-2.0.0/source.ml", content: betaSource },
      ]),
    ],
    semgrepFiles: [
      { archivePath: "semgrep/LICENSE", sha256: sha256(semgrepLicense) },
      { archivePath: "semgrep/semgrep.opam", sha256: sha256(semgrepOpam) },
    ],
    externalSources: [
      { archivePath: "external-sources/pinned.tar.gz", sha256: sha256(externalText) },
    ],
    repositoryFiles: [
      { sourcePath: controlledPath, archivePath: "friendly-adversary/controlled.txt" },
      { sourcePath: manifestPath, archivePath: "friendly-adversary/corresponding-source-manifest.json" },
    ],
    repositoryDirectories: [],
    fingerprintFiles: [],
    sourceBundlePatchFiles: [],
  };

  await write(root, "engines/semgrep-wasm/upstream-lock.json", `${JSON.stringify(lock, null, 2)}\n`);
  await write(root, "engines/semgrep-wasm/source/linked-components.json", `${JSON.stringify(linked, null, 2)}\n`);
  await write(root, controlledPath, controlledText);
  await write(root, manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  await write(bundle, "SOURCE-BUNDLE.json", `${JSON.stringify({
    schemaVersion: 1,
    semgrepVersion: "1.172.0",
    semgrepCommit: lock.commit,
    sourceDateEpoch: 1786147200,
    patches: {},
    distributionLicense: "GPL-3.0-only",
    releaseScope: "public",
    publicSourceOffer: "https://github.com/mattlgroff/friendly-adversary/releases/download/v3.0.4/semgrep-1.172.0-friendly-adversary-corresponding-source.tar.gz",
    publicPublicationBlocked: options.publicPublicationBlocked ?? false,
  }, null, 2)}\n`);
  await write(bundle, "semgrep/LICENSE", semgrepLicense);
  await write(bundle, "semgrep/semgrep.opam", semgrepOpam);
  await write(bundle, "semgrep/src/core.ml", options.archiveSemgrepText ?? semgrepSource);
  if (!options.omitSubmodule) await write(bundle, "semgrep/vendor/parser/parser.ml", parserSource);
  await write(bundle, "opam-sources/alpha-1.0.0/source.ml", options.archiveOpamText ?? alphaSource);
  if (!options.omitSecondOpamPackage) await write(bundle, "opam-sources/beta-2.0.0/source.ml", betaSource);
  await write(bundle, "external-sources/pinned.tar.gz", options.archiveExternalText ?? externalText);
  await write(bundle, "friendly-adversary/controlled.txt", options.archiveControlledText ?? controlledText);
  await mkdir(path.join(bundle, "friendly-adversary"), { recursive: true });
  await copyFile(path.join(root, ...manifestPath.split("/")), path.join(bundle, "friendly-adversary", "corresponding-source-manifest.json"));

  const archive = path.join(directory, "source.tar.gz");
  createArchive(archive, staging, archiveRoot);
  return { archive, directory, root };
}

function record(root: string, archive: string, output: string) {
  return execFileSync(process.execPath, [verifier, "record", "--root", root, "--archive", archive, "--output", output], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

async function completePublication(archive: string, evidence: string) {
  const sidecar = `${archive}.evidence.json`;
  await copyFile(evidence, sidecar);
  const fileRecord = async (file: string) => {
    const content = await readFile(file);
    return { filename: path.basename(file), bytes: content.byteLength, sha256: sha256(content) };
  };
  await writeFile(`${archive}.complete.json`, `${JSON.stringify({
    schemaVersion: 1,
    status: "complete",
    archive: await fileRecord(archive),
    evidence: await fileRecord(sidecar),
  }, null, 2)}\n`);
  return { sidecar };
}

async function refreshCompletion(archive: string) {
  const sidecar = `${archive}.evidence.json`;
  const fileRecord = async (file: string) => {
    const content = await readFile(file);
    return { filename: path.basename(file), bytes: content.byteLength, sha256: sha256(content) };
  };
  await writeFile(`${archive}.complete.json`, `${JSON.stringify({
    schemaVersion: 1,
    status: "complete",
    archive: await fileRecord(archive),
    evidence: await fileRecord(sidecar),
  }, null, 2)}\n`);
}

test("corresponding-source recorder produces deterministic validated evidence", async (context) => {
  const { archive, directory, root } = await fixture();
  context.after(() => rm(directory, { force: true, recursive: true }));
  const first = path.join(directory, "first.json");
  const second = path.join(directory, "second.json");
  record(root, archive, first);
  record(root, archive, second);
  assert.deepEqual(await readFile(first), await readFile(second));

  const evidence = JSON.parse(await readFile(first, "utf8"));
  assert.equal(evidence.schemaVersion, 2);
  assert.match(evidence.archive.sha256, /^[a-f0-9]{64}$/u);
  assert.equal(evidence.sourceInputs.algorithm, "sha256");
  assert.match(evidence.sourceInputs.fingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(evidence.releaseScope, "public");
  assert.equal(evidence.publicPublicationBlocked, false);

  await completePublication(archive, first);
  const verified = execFileSync(process.execPath, [verifier, "verify", "--root", root, "--evidence", first, "--archive", archive], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(JSON.parse(verified).status, "verified");
  assert.equal(JSON.parse(verified).archiveVerification.status, "verified");
});

test("archive verification requires the final completion marker", async (context) => {
  const { archive, directory, root } = await fixture();
  context.after(() => rm(directory, { force: true, recursive: true }));
  record(root, archive, `${archive}.evidence.json`);
  const rejected = spawnSync(process.execPath, [verifier, "verify", "--root", root, "--archive", archive], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /completion marker/u);
});

test("archive verification rejects a torn completed publication", async (context) => {
  const { archive, directory, root } = await fixture();
  context.after(() => rm(directory, { force: true, recursive: true }));
  const evidence = path.join(directory, "retained-evidence.json");
  record(root, archive, evidence);
  const { sidecar } = await completePublication(archive, evidence);
  await rm(sidecar);
  const rejected = spawnSync(process.execPath, [verifier, "verify", "--root", root, "--evidence", evidence, "--archive", archive], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /evidence sidecar/u);
});

test("archive verification rejects semantically divergent completed sidecar evidence", async (context) => {
  const { archive, directory, root } = await fixture();
  context.after(() => rm(directory, { force: true, recursive: true }));
  const evidence = path.join(directory, "retained-evidence.json");
  record(root, archive, evidence);
  const { sidecar } = await completePublication(archive, evidence);
  const forged = JSON.parse(await readFile(sidecar, "utf8"));
  forged.semgrepCommit = "0".repeat(40);
  forged.publicSourceOffer = "https://invalid.example/source";
  forged.publicPublicationBlocked = true;
  forged.releaseStatus = "private-build-evidence-only";
  await writeFile(sidecar, `${JSON.stringify(forged, null, 2)}\n`);
  await refreshCompletion(archive);
  const rejected = spawnSync(process.execPath, [verifier, "verify", "--root", root, "--evidence", evidence, "--archive", archive], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /sidecar\.semgrepCommit|sidecar\.publicSourceOffer|sidecar\.publicPublicationBlocked|sidecar\.releaseStatus/u);
});

test("source packager stages on the output filesystem and publishes completion last", async () => {
  const packager = await readFile(path.join(repositoryRoot, "scripts", "package-semgrep-corresponding-source.sh"), "utf8");
  assert.match(packager, /mktemp -d "\$OUTPUT_DIRECTORY\/\.\$\{OUTPUT_BASENAME\}\.staging\.XXXXXX"/u);
  const sidecarMove = packager.indexOf('publish_no_clobber "$STAGING/corresponding-source.evidence.json" "$SIDECAR"');
  const archiveMove = packager.indexOf('publish_no_clobber "$ARCHIVE.gz" "$OUTPUT"');
  const completionMove = packager.indexOf('publish_no_clobber "$STAGING/corresponding-source.complete.json" "$COMPLETION"');
  assert.ok(sidecarMove >= 0 && sidecarMove < archiveMove);
  assert.ok(archiveMove < completionMove);
  assert.ok(completionMove < packager.indexOf("PUBLICATION_COMMITTED=1"));
  assert.match(packager, /PUBLICATION_CLI=.*corresponding-source-publication\.mjs/u);
  assert.match(packager, /node "\$PUBLICATION_CLI" guard acquire/u);
  assert.match(packager, /local guard="\$output\.lock\.guard"/u);
  assert.match(packager, /node "\$PUBLICATION_CLI" transaction "\$operation"/u);
  assert.match(packager, /publication_transaction abort-unpublished "\$OUTPUT" "\$STAGING" "\$LOCK_TOKEN" "\$TRANSACTION_SOURCE"/u);
  assert.doesNotMatch(packager, /\b(?:flock|lockf|ps -o)\b/u);
  assert.doesNotMatch(packager, /rm -rf "\$STAGING"/u);
});

test("verification rejects evidence after a fingerprinted repository input changes", async (context) => {
  const { archive, directory, root } = await fixture();
  context.after(() => rm(directory, { force: true, recursive: true }));
  const evidence = path.join(directory, "evidence.json");
  record(root, archive, evidence);
  await write(root, "fixture/controlled.txt", "changed after evidence publication\n");
  const rejected = spawnSync(process.execPath, [verifier, "verify", "--root", root, "--evidence", evidence], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /sourceInputs\.fingerprint/u);
});

test("no-archive verification reports current evidence without claiming archive verification", async (context) => {
  const { archive, directory, root } = await fixture();
  context.after(() => rm(directory, { force: true, recursive: true }));
  const evidencePath = path.join(directory, "evidence.json");
  record(root, archive, evidencePath);
  const result = execFileSync(process.execPath, [verifier, "verify", "--root", root, "--evidence", evidencePath], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(JSON.parse(result).status, "evidence-current");
  assert.equal(JSON.parse(result).archiveVerification.status, "not-present");
});

test("recorder rejects an unrelated tarball", async (context) => {
  const { directory, root } = await fixture();
  context.after(() => rm(directory, { force: true, recursive: true }));
  const unrelated = path.join(directory, "unrelated");
  await write(unrelated, "source.txt", "not corresponding source\n");
  const archive = path.join(directory, "unrelated.tar.gz");
  createArchive(archive, unrelated, ".");
  const output = path.join(directory, "unrelated.json");
  const rejected = spawnSync(process.execPath, [verifier, "record", "--root", root, "--archive", archive, "--output", output], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /not normalized|exact semgrep-1\.172\.0-friendly-adversary-source root/u);
  await assert.rejects(readFile(output), { code: "ENOENT" });
});

test("recorder rejects changed repository-controlled bundle bytes", async (context) => {
  const { archive, directory, root } = await fixture({ archiveControlledText: "changed after collection\n" });
  context.after(() => rm(directory, { force: true, recursive: true }));
  const rejected = spawnSync(process.execPath, [verifier, "record", "--root", root, "--archive", archive], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /friendly-adversary\/controlled\.txt does not match its trusted SHA-256/u);
});

test("recorder rejects changed external sources and missing OPAM prefixes", async (context) => {
  const { archive, directory, root } = await fixture({ archiveExternalText: "wrong external bytes\n", omitSecondOpamPackage: true });
  context.after(() => rm(directory, { force: true, recursive: true }));
  const rejected = spawnSync(process.execPath, [verifier, "record", "--root", root, "--archive", archive], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /external-sources\/pinned\.tar\.gz does not match its trusted SHA-256/u);
  assert.match(rejected.stderr, /Missing OPAM source content: opam-sources\/beta-2\.0\.0/u);
});

test("recorder rejects changed ordinary Semgrep and OPAM source bytes", async (context) => {
  const { archive, directory, root } = await fixture({
    archiveSemgrepText: "let core = false\n",
    archiveOpamText: "let alpha = false\n",
  });
  context.after(() => rm(directory, { force: true, recursive: true }));
  const rejected = spawnSync(process.execPath, [verifier, "record", "--root", root, "--archive", archive], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /semgrep content tree is .* expected/u);
  assert.match(rejected.stderr, /opam-sources content tree is .* expected/u);
});

test("recorder rejects unsafe normalized member paths", async (context) => {
  const { directory, root } = await fixture();
  context.after(() => rm(directory, { force: true, recursive: true }));
  const archive = path.join(directory, "traversal.tar.gz");
  await writeSingleMemberTarGz(archive, `${archiveRoot}/../escape.txt`, "escape\n");
  const rejected = spawnSync(process.execPath, [verifier, "record", "--root", root, "--archive", archive], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /tar member path is not normalized/u);
});

test("recorder rejects blocked publication metadata and missing submodules", async (context) => {
  const { archive, directory, root } = await fixture({ omitSubmodule: true, publicPublicationBlocked: true });
  context.after(() => rm(directory, { force: true, recursive: true }));
  const rejected = spawnSync(process.execPath, [verifier, "record", "--root", root, "--archive", archive], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /SOURCE-BUNDLE\.json publicPublicationBlocked is true, expected false/u);
  assert.match(rejected.stderr, /Missing required submodule content: semgrep\/vendor\/parser/u);
});
