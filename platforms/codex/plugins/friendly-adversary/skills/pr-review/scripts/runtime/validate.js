import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { FriendlyAdversaryError } from "./errors.js";
import { pathExists } from "./fs-utils.js";
import { RIPGREP_WASM_SHA256 } from "./ripgrep-wasm.js";
const IDS = ["repository-fit", "correctness", "contracts", "state-and-concurrency", "security", "data-integrity", "verification", "operability", "anti-slop"];
const SECTIONS = ["## Property", "## Failure classes", "## Applicability", "## Audit mode", "## Evidence to inspect", "## Investigation procedure", "## Abstain when", "## Finding contract", "## Valid finding example", "## Invalid finding example"];
const OXLINT_SHA256 = "8893c7e1a230eea648ca646a578afbd62c1712f9f8d36a4ab2e8589c73b6a5bb";
const RUFF_WASM_SHA256 = "94bbf4cb394817181bcdf793eee3f0ae2574f0dca912fe99ab4012ee4d8bad4f";
const RUFF_GLUE_SHA256 = "ec74250fabf2aadd864ffdc1df86fe5ec7901466837a7ebc7e8de306f0563897";
const OXLINT_LICENSE_SELECTIONS = new Map([
    ["(MIT OR Apache-2.0) AND Unicode-3.0", "MIT AND Unicode-3.0"],
    ["0BSD OR MIT OR Apache-2.0", "MIT"],
    ["Apache-2.0", "Apache-2.0"],
    ["Apache-2.0 OR BSL-1.0", "Apache-2.0"],
    ["Apache-2.0 OR GPL-2.0-only", "Apache-2.0"],
    ["Apache-2.0 OR MIT", "MIT"],
    ["Apache-2.0 WITH LLVM-exception OR BSL-1.0", "Apache-2.0 WITH LLVM-exception"],
    ["Apache-2.0/MIT", "MIT"],
    ["MIT", "MIT"],
    ["MIT OR Apache-2.0", "MIT"],
    ["MIT OR Zlib OR Apache-2.0", "MIT"],
    ["MIT/Apache-2.0", "MIT"],
    ["Unicode-3.0", "Unicode-3.0"],
    ["Unlicense OR MIT", "MIT"],
    ["Unlicense/MIT", "MIT"],
    ["Zlib", "Zlib"],
]);
async function validateOxlintArtifact(errors, root, relative) {
    const artifactPath = path.join(root, ...relative.split("/"));
    if (!await pathExists(artifactPath)) {
        errors.push(`Missing Oxlint WebAssembly artifact: ${relative}`);
        return;
    }
    const artifact = await readFile(artifactPath);
    if (!artifact.subarray(0, 4).equals(Buffer.from([0x00, 0x61, 0x73, 0x6d]))) {
        errors.push(`${relative}: invalid WebAssembly header`);
    }
    const digest = createHash("sha256").update(artifact).digest("hex");
    if (digest !== OXLINT_SHA256)
        errors.push(`${relative}: SHA-256 ${digest} does not match ${OXLINT_SHA256}`);
}
async function validateRuffArtifact(errors, root) {
    const runtimeRoot = path.join(root, "engines", "ruff-wasm", "runtime");
    for (const [file, expected] of [["ruff_wasm_bg.wasm", RUFF_WASM_SHA256], ["ruff_wasm.js", RUFF_GLUE_SHA256]]) {
        const relative = `engines/ruff-wasm/runtime/${file}`;
        const artifactPath = path.join(runtimeRoot, file);
        if (!await pathExists(artifactPath)) {
            errors.push(`Missing Ruff WebAssembly artifact: ${relative}`);
            continue;
        }
        const artifact = await readFile(artifactPath);
        if (file.endsWith(".wasm") && !artifact.subarray(0, 4).equals(Buffer.from([0x00, 0x61, 0x73, 0x6d]))) {
            errors.push(`${relative}: invalid WebAssembly header`);
        }
        const digest = createHash("sha256").update(artifact).digest("hex");
        if (digest !== expected)
            errors.push(`${relative}: SHA-256 ${digest} does not match ${expected}`);
    }
}
async function validateRipgrepArtifact(errors, root) {
    const relative = "engines/ripgrep-wasm/runtime/rg.wasm";
    const artifactPath = path.join(root, ...relative.split("/"));
    if (!await pathExists(artifactPath)) {
        errors.push(`Missing ripgrep WebAssembly artifact: ${relative}`);
        return;
    }
    const artifact = await readFile(artifactPath);
    if (!artifact.subarray(0, 4).equals(Buffer.from([0x00, 0x61, 0x73, 0x6d]))) {
        errors.push(`${relative}: invalid WebAssembly header`);
        return;
    }
    const digest = createHash("sha256").update(artifact).digest("hex");
    if (digest !== RIPGREP_WASM_SHA256)
        errors.push(`${relative}: SHA-256 ${digest} does not match ${RIPGREP_WASM_SHA256}`);
    try {
        const module = new WebAssembly.Module(Uint8Array.from(artifact));
        if (WebAssembly.Module.imports(module).some((entry) => entry.module !== "wasi_snapshot_preview1")) {
            errors.push(`${relative}: imports a non-WASI capability`);
        }
    }
    catch (error) {
        errors.push(`${relative}: cannot compile (${error instanceof Error ? error.message : String(error)})`);
    }
}
async function validateRipgrepDistribution(errors, root) {
    const relativeRoot = "engines/ripgrep-wasm";
    const engineRoot = path.join(root, "engines", "ripgrep-wasm");
    const sumsPath = path.join(engineRoot, "SHA256SUMS");
    if (!await pathExists(sumsPath)) {
        errors.push(`Missing ripgrep distribution manifest: ${relativeRoot}/SHA256SUMS`);
        return;
    }
    const expected = new Map();
    for (const line of (await readFile(sumsPath, "utf8")).trim().split(/\r?\n/u)) {
        const match = /^([a-f0-9]{64})  (.+)$/u.exec(line);
        if (!match?.[1] || !match[2] || match[2].startsWith("/") || match[2].split("/").includes("..")) {
            errors.push(`${relativeRoot}/SHA256SUMS: malformed entry ${line}`);
            continue;
        }
        if (expected.has(match[2]))
            errors.push(`${relativeRoot}/SHA256SUMS: duplicate entry ${match[2]}`);
        expected.set(match[2], match[1]);
    }
    const actual = (await walk(engineRoot))
        .map((file) => file.split(path.sep).join("/"))
        .filter((file) => file !== "SHA256SUMS")
        .sort();
    const required = [
        "README.md",
        "THIRD_PARTY_LICENSES.md",
        "conformance/UPSTREAM_TESTS.md",
        "conformance/test-harness-wasi.patch",
        "conformance/licenses.sha256",
        "conformance/upstream-tests-classified.tsv",
        "licenses/encoding_rs-0.8.35/LICENSE-WHATWG",
        "licenses/rust-1.97.1/COPYRIGHT-library.html",
        "runtime/rg.wasm",
        "source/ripgrep-15.2.0-source.tar.gz",
        "upstream-lock.json",
    ];
    for (const file of required)
        if (!actual.includes(file))
            errors.push(`${relativeRoot}/${file}: required distribution evidence is missing`);
    if (actual.length < 60)
        errors.push(`${relativeRoot}: incomplete distribution inventory (${actual.length} files)`);
    for (const file of actual) {
        const digest = createHash("sha256").update(await readFile(path.join(engineRoot, ...file.split("/")))).digest("hex");
        if (expected.get(file) !== digest)
            errors.push(`${relativeRoot}/${file}: missing or mismatched checksum`);
    }
    for (const file of expected.keys())
        if (!actual.includes(file))
            errors.push(`${relativeRoot}/${file}: listed but missing`);
    try {
        const lock = JSON.parse(await readFile(path.join(engineRoot, "upstream-lock.json"), "utf8"));
        if (lock.upstream?.tag !== "15.2.0" || lock.upstream.commit !== "e89fff89ac9af12e8d4ce9d5fd07beb408ca730f") {
            errors.push(`${relativeRoot}/upstream-lock.json: unexpected upstream identity`);
        }
        if (lock.upstream?.sourceArchive?.sha256 !== "1bbc690deaac5b5d68168574b0ced021dc2cdf65db436329fc20a9aae36d8406") {
            errors.push(`${relativeRoot}/upstream-lock.json: unexpected source archive identity`);
        }
        if (lock.build?.rustc !== "1.97.1"
            || lock.build.rustcCommit !== "8bab26f4f68e0e26f0bb7960be334d5b520ea452"
            || lock.build.target !== "wasm32-wasip1"
            || lock.build.sourcePatches !== 0
            || lock.build.pcre2Enabled !== false) {
            errors.push(`${relativeRoot}/upstream-lock.json: unexpected build identity`);
        }
        if (lock.runtime?.sha256 !== RIPGREP_WASM_SHA256
            || JSON.stringify(lock.runtime.imports) !== JSON.stringify(["wasi_snapshot_preview1"])) {
            errors.push(`${relativeRoot}/upstream-lock.json: unexpected runtime identity`);
        }
        const noticeHashes = {
            rustCopyrightLibrarySha256: "0a65bb747c49c7bb816cbc7188319bd6e4e8d08091c1190b8a3c0971c47968ed",
            rustLicenseMitSha256: "b71bd43a069ca0641a9ecfe585ca7b3c53b5cc1608f8b68321168698e28b5ea1",
            rustLicenseApache20Sha256: "62c7a1e35f56406896d7aa7ca52d0cc0d272ac022b5d2796e7d6905db8a3636a",
            licenseManifestSha256: "b1def776dbe99e9a20108641575e3a83627e48c998e1e92e96bd2385197c4498",
        };
        for (const [name, digest] of Object.entries(noticeHashes)) {
            if (lock.notices?.[name] !== digest)
                errors.push(`${relativeRoot}/upstream-lock.json: unexpected ${name}`);
        }
    }
    catch (error) {
        errors.push(`${relativeRoot}/upstream-lock.json: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    }
}
function metadata(content) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(content);
    if (!match?.[1])
        return {};
    return Object.fromEntries(match[1].split(/\r?\n/u).flatMap((line) => { const at = line.indexOf(":"); return at < 0 ? [] : [[line.slice(0, at).trim(), line.slice(at + 1).trim()]]; }));
}
function metadataList(value) {
    if (!value || !/^\[[^\]]+\]$/.test(value))
        return undefined;
    const values = value.slice(1, -1).split(",").map((entry) => entry.trim());
    if (!values.length || values.some((entry) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry)))
        return undefined;
    return values;
}
function sectionBody(content, heading) {
    const start = content.indexOf(heading);
    if (start < 0)
        return "";
    const bodyStart = start + heading.length;
    const next = content.indexOf("\n## ", bodyStart);
    return content.slice(bodyStart, next < 0 ? undefined : next).trim();
}
async function walk(root, current = root) {
    const files = [];
    for (const entry of await readdir(current, { withFileTypes: true })) {
        const absolute = path.join(current, entry.name);
        const relative = path.relative(root, absolute).split(path.sep).join("/");
        if ([".git", ".friendly-adversary", "node_modules", "dist", "build/oxlint-wasm/target"].some((directory) => relative === directory || relative.startsWith(`${directory}/`)))
            continue;
        if (entry.isDirectory())
            files.push(...await walk(root, absolute));
        else
            files.push(path.relative(root, absolute));
    }
    return files;
}
async function validateThirdPartyNotices(errors, root) {
    const noticeRoot = path.join(root, "third-party", "oxlint-wasm");
    const sumsPath = path.join(noticeRoot, "SHA256SUMS");
    if (!await pathExists(sumsPath)) {
        errors.push("Missing third-party notice file: third-party/oxlint-wasm/SHA256SUMS");
        return;
    }
    const expected = new Map();
    for (const line of (await readFile(sumsPath, "utf8")).trim().split(/\r?\n/u)) {
        const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
        if (!match?.[1] || !match[2] || match[2].startsWith("/") || match[2].split("/").includes("..")) {
            errors.push(`third-party/oxlint-wasm/SHA256SUMS: malformed entry ${line}`);
            continue;
        }
        if (expected.has(match[2]))
            errors.push(`third-party/oxlint-wasm/SHA256SUMS: duplicate entry ${match[2]}`);
        expected.set(match[2], match[1]);
    }
    const actual = (await walk(noticeRoot)).map((file) => file.split(path.sep).join("/")).filter((file) => file !== "SHA256SUMS").sort();
    if (!actual.includes("NOTICE.md") || actual.length < 165)
        errors.push(`third-party/oxlint-wasm: incomplete notice inventory (${actual.length} files)`);
    const notice = await readFile(path.join(noticeRoot, "NOTICE.md"), "utf8").catch(() => "");
    if (!notice.includes("| Upstream license expression | Selected compatible license |"))
        errors.push("third-party/oxlint-wasm/NOTICE.md: missing compatible-license selections");
    const selections = new Map();
    for (const line of notice.split(/\r?\n/u)) {
        const match = /^\| `([^`]+)` \| `([^`]+)` \|$/u.exec(line);
        if (match?.[1] && match[2]) {
            if (selections.has(match[1]))
                errors.push(`third-party/oxlint-wasm/NOTICE.md: duplicate license selection for ${match[1]}`);
            selections.set(match[1], match[2]);
        }
    }
    for (const [expression, selected] of OXLINT_LICENSE_SELECTIONS) {
        if (selections.get(expression) !== selected) {
            errors.push(`third-party/oxlint-wasm/NOTICE.md: expected ${expression} to select ${selected}`);
        }
    }
    for (const expression of selections.keys()) {
        if (!OXLINT_LICENSE_SELECTIONS.has(expression)) {
            errors.push(`third-party/oxlint-wasm/NOTICE.md: unexpected license expression ${expression}`);
        }
    }
    const dependencyTable = notice.split("| Package | Version | Upstream license expression | Source |")[1] ?? "";
    const noticeRows = dependencyTable.split(/\r?\n/u).filter((line) => /^\| [^ -]/u.test(line));
    if (noticeRows.length !== 164)
        errors.push(`third-party/oxlint-wasm/NOTICE.md: expected 164 dependency rows, found ${noticeRows.length}`);
    for (const row of noticeRows) {
        const columns = row.split("|").map((column) => column.trim());
        const expression = columns[3] ?? "";
        const expectedSelection = OXLINT_LICENSE_SELECTIONS.get(expression);
        if (!expectedSelection || selections.get(expression) !== expectedSelection) {
            errors.push(`third-party/oxlint-wasm/NOTICE.md: license expression does not match the pinned selection contract in ${row}`);
        }
    }
    for (const file of actual) {
        const digest = createHash("sha256").update(await readFile(path.join(noticeRoot, ...file.split("/")))).digest("hex");
        if (expected.get(file) !== digest)
            errors.push(`third-party/oxlint-wasm/${file}: missing or mismatched checksum`);
    }
    for (const file of expected.keys())
        if (!actual.includes(file))
            errors.push(`third-party/oxlint-wasm/${file}: listed but missing`);
}
async function validatePortableFiles(errors, root) {
    const forbiddenNativeExtensions = new Set([".node", ".exe", ".dll", ".dylib", ".so"]);
    for (const file of await walk(root)) {
        if (forbiddenNativeExtensions.has(path.extname(file).toLowerCase())) {
            errors.push(`${file}: forbidden native runtime artifact`);
            continue;
        }
        if (file.endsWith(".wasm"))
            continue;
        if (path.basename(file) === "friendly-adversary-mcp.cjs")
            continue;
        const bytes = await readFile(path.join(root, file)).catch(() => Buffer.alloc(0));
        const prefix = bytes.subarray(0, 4).toString("hex");
        if (bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
            || bytes.subarray(0, 2).equals(Buffer.from("MZ"))
            || bytes.subarray(0, 8).equals(Buffer.from("!<arch>\n"))
            || bytes.subarray(0, 4).equals(Buffer.from([0x42, 0x43, 0xc0, 0xde]))
            || ["feedface", "feedfacf", "cefaedfe", "cffaedfe", "cafebabe", "cafebabf"].includes(prefix)) {
            errors.push(`${file}: forbidden native executable signature`);
            continue;
        }
        const segments = file.split(path.sep);
        if (segments.includes("third-party") || segments.includes("license-overrides"))
            continue;
        const portable = file.split(path.sep).join("/");
        if (/engines\/(?:semgrep-wasm\/(?:runtime|source\/patches)|ruff-wasm\/runtime)\//u.test(portable))
            continue;
        const content = bytes.toString("utf8");
        const placeholder = "TO" + "DO";
        if (new RegExp(`\\b${placeholder}\\b`).test(content))
            errors.push(`${file}: contains a placeholder`);
        const forbiddenPunctuation = String.fromCodePoint(0x2014);
        if (content.includes(forbiddenPunctuation))
            errors.push(`${file}: contains forbidden punctuation`);
    }
}
export function validateMcpManifestContract(platform, value) {
    const expected = platform === "claude-code"
        ? {
            mcpServers: {
                "friendly-adversary-reports": {
                    command: "node",
                    args: ["--permission", "--allow-fs-read=*", "--allow-fs-write=*", "--no-addons", "${CLAUDE_PLUGIN_ROOT}/skills/pr-review/scripts/runtime/friendly-adversary-mcp.cjs"],
                    env: { NODE_OPTIONS: "", NODE_PATH: "" },
                },
            },
        }
        : {
            "friendly-adversary-reports": {
                command: "node",
                args: ["--permission", "--allow-fs-read=*", "--allow-fs-write=*", "--no-addons", "skills/pr-review/scripts/runtime/friendly-adversary-mcp.cjs"],
                cwd: ".",
                enabled_tools: ["record_artifact"],
                default_tools_approval_mode: "approve",
                env: { NODE_OPTIONS: "", NODE_PATH: "" },
            },
        };
    return JSON.stringify(value) === JSON.stringify(expected) ? [] : [`${platform} MCP launch manifest differs from the required stdio contract`];
}
function validateLens(errors, id, content) {
    const values = metadata(content);
    if (values.id !== id)
        errors.push(`${id}: frontmatter id differs from path`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
        errors.push(`${id}: unsafe lens identifier`);
    if (values.version !== "1")
        errors.push(`${id}: unsupported lens contract version`);
    for (const key of ["title", "version", "languages", "applies_to", "evidence", "evaluation_tags"])
        if (!values[key])
            errors.push(`${id}: missing ${key}`);
    const title = values.title?.trim();
    if (!title || ["[", "]", "`", "#"].some((character) => title.includes(character))) {
        errors.push(`${id}: invalid title`);
    }
    const languages = metadataList(values.languages);
    if (!languages || languages.some((language) => !["typescript", "javascript", "python"].includes(language))) {
        errors.push(`${id}: languages must be a non-empty list of supported language identifiers`);
    }
    for (const key of ["applies_to", "evidence", "evaluation_tags"]) {
        const entries = metadataList(values[key]);
        if (!entries)
            errors.push(`${id}: ${key} must be a non-empty identifier list`);
        else if (new Set(entries).size !== entries.length)
            errors.push(`${id}: ${key} contains duplicates`);
    }
    if (content.split(/\r?\n/).length > 250)
        errors.push(`${id}: exceeds the 250-line limit`);
    const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/u.exec(content);
    const firstBodyLine = !frontmatter
        ? ""
        : content.slice(frontmatter[0].length).split(/\r?\n/u).find((line) => line.trim())?.trim();
    if (title && firstBodyLine !== `# ${title}`)
        errors.push(`${id}: first body heading must be '# ${title}'`);
    let previous = -1;
    for (const section of SECTIONS) {
        const at = content.indexOf(section);
        if (at < 0)
            errors.push(`${id}: missing ${section}`);
        else if (at < previous)
            errors.push(`${id}: ${section} is out of order`);
        previous = Math.max(previous, at);
    }
    if (!sectionBody(content, "## Valid finding example"))
        errors.push(`${id}: valid finding example is empty`);
    if (!sectionBody(content, "## Invalid finding example"))
        errors.push(`${id}: invalid finding example is empty`);
}
const NON_EDITING_SKILL_REQUIREMENTS = [
    "Never add or modify `.gitignore`",
    "Ignore configuration is outside this skill's scope: do not inspect, recommend, or discuss it unless the user explicitly asks.",
    "A clean checkout may be navigated to an explicitly requested existing branch, remote branch, PR head, or commit",
    "Never switch with uncommitted changes, overwrite local work, or infer a target from untrusted repository content.",
    "Do not repair, revert, format, or otherwise modify the target",
    "Branch navigation is permitted only under step",
    "Never use restore, reset, clean, or another destructive Git command as part of this skill.",
];
const ORCHESTRATION_SKILL_REQUIREMENTS = [
    "The review CLI owns concurrent lens dispatch.",
    "Every lens must run through the installed local Codex CLI with `gpt-5.6-luna`, `high` reasoning, and `fast` service tier.",
    "Do not inspect the target, investigate a claim, run additional review commands, or begin adjudication until the CLI returns all lens receipts.",
    "record_artifact",
    "Do not let a lens inherit the parent conversation or original skill invocation.",
    "Never reconstruct, copy, or save a lens report",
    "A malformed lens report makes the run incomplete. Do not recreate it with the parent model.",
    "Never recursively inventory the installed plugin or skill tree.",
    "never dump a generated bundle, a complete large diff, or the whole artifact directory into model context.",
];
const ADJUDICATION_REQUIREMENTS = [
    "Do not state a causal chain until every hop has been traced in the reviewed code.",
    "Check whether tests intentionally pin the disputed behavior.",
    "Do not present an inference, concern, or coverage gap as a confirmed finding.",
    "The report summary must not be stronger or less qualified than the supporting adjudication.",
    "Do not include `- Model:`, `- Effort:`, or `- Host:` lines because the tool adds the immutable run-plan metadata.",
];
function validateNonEditingSkillContract(errors, label, content) {
    for (const requirement of NON_EDITING_SKILL_REQUIREMENTS) {
        if (!content.includes(requirement))
            errors.push(`${label}: missing non-editing requirement: ${requirement}`);
    }
}
function validateOrchestrationSkillContract(errors, label, content) {
    for (const requirement of ORCHESTRATION_SKILL_REQUIREMENTS) {
        if (!content.includes(requirement))
            errors.push(`${label}: missing orchestration requirement: ${requirement}`);
    }
}
function validateCodexForkIsolation(errors, label, content) {
    if (!content.includes("Do not spawn a subagent for a lens."))
        errors.push(`${label}: missing prohibition on Codex lens subagents`);
    if (!content.includes('sandbox_permissions: "require_escalated"')) {
        errors.push(`${label}: missing required escalated collector launch`);
    }
    if (!content.includes("never invoke `review` again")) {
        errors.push(`${label}: missing Codex long-running collector retry prohibition`);
    }
}
function validateAdjudicationContract(errors, label, content) {
    for (const requirement of ADJUDICATION_REQUIREMENTS) {
        if (!content.includes(requirement))
            errors.push(`${label}: missing adjudication requirement: ${requirement}`);
    }
}
function validateFindingContract(errors, label, content) {
    const toolOwnedMetadataInstruction = "Do not include `- Model:`, `- Effort:`, or `- Host:` lines";
    if (!content.includes(toolOwnedMetadataInstruction)) {
        errors.push(`${label}: missing tool-owned metadata instruction: ${toolOwnedMetadataInstruction}`);
    }
    if (/Start every lens report with this metadata/iu.test(content)) {
        errors.push(`${label}: contradicts tool-owned metadata publication`);
    }
}
export async function validateRepository(root) {
    const errors = [];
    const lensRoot = path.join(root, "lenses");
    const bundledLensRoot = path.join(root, "references", "lenses");
    if (!await pathExists(lensRoot) && await pathExists(bundledLensRoot)) {
        const lensFiles = (await readdir(bundledLensRoot)).filter((file) => file.endsWith(".md")).sort();
        const actual = lensFiles.map((file) => file.slice(0, -3));
        for (const id of IDS)
            if (!actual.includes(id))
                errors.push(`Missing bundled lens: ${id}`);
        for (const file of lensFiles)
            validateLens(errors, file.slice(0, -3), await readFile(path.join(bundledLensRoot, file), "utf8"));
        for (const required of ["LICENSE", "LICENSING.md", "package.json", "SKILL.md", "scripts/runtime/cli.js", "scripts/runtime/wasm/oxlint/engine.wasm", "scripts/runtime/wasm/oxlint/LICENSE-OXC-MIT.txt", "third-party/oxlint-wasm/NOTICE.md", "engines/ruff-wasm/runtime/ruff_wasm.js", "engines/ruff-wasm/runtime/ruff_wasm_bg.wasm", "engines/ruff-wasm/LICENSE", "engines/ruff-wasm/upstream-lock.json", "engines/ripgrep-wasm/runtime/rg.wasm", "engines/ripgrep-wasm/upstream-lock.json", "engines/ripgrep-wasm/SHA256SUMS", "engines/ripgrep-wasm/THIRD_PARTY_LICENSES.md", "engines/semgrep-wasm/runtime-manifest.json", "engines/semgrep-wasm/runtime/engine/semgrep-engine.wasm", "engines/semgrep-wasm/source/generated-parser-license-evidence.json", "engines/semgrep-wasm/source/licenses/GENERATED-PARSERS-GPL-3.0.txt", "engines/semgrep-wasm/source/licenses/SEMGREP-LGPL-2.1.txt", "rules/semgrep/javascript.yml", "rules/semgrep/python.yml", "references/adjudication.md", "references/finding-contract.md"]) {
            if (!await pathExists(path.join(root, required)))
                errors.push(`Missing bundled file: ${required}`);
        }
        try {
            const runtimePackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
            if (runtimePackage.private !== true)
                errors.push("package.json must mark the installed skill runtime private");
            if (runtimePackage.type !== "module")
                errors.push("package.json must mark the installed skill runtime as an ES module");
        }
        catch (error) {
            errors.push(`package.json: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
        }
        const installedSkill = await readFile(path.join(root, "SKILL.md"), "utf8");
        validateNonEditingSkillContract(errors, "SKILL.md", installedSkill);
        validateOrchestrationSkillContract(errors, "SKILL.md", installedSkill);
        if (await pathExists(path.join(root, "agents", "openai.yaml"))) {
            validateCodexForkIsolation(errors, "SKILL.md", installedSkill);
        }
        validateAdjudicationContract(errors, "references/adjudication.md", await readFile(path.join(root, "references", "adjudication.md"), "utf8"));
        validateFindingContract(errors, "references/finding-contract.md", await readFile(path.join(root, "references", "finding-contract.md"), "utf8"));
        await validateOxlintArtifact(errors, root, "scripts/runtime/wasm/oxlint/engine.wasm");
        await validateRuffArtifact(errors, root);
        await validateRipgrepArtifact(errors, root);
        await validateRipgrepDistribution(errors, root);
        await validateThirdPartyNotices(errors, root);
        await validatePortableFiles(errors, root);
        if (errors.length)
            throw new FriendlyAdversaryError(`Plugin bundle validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`, 2);
        return [`Validated ${actual.length} bundled lenses`, "Validated plugin runtime and review contracts"];
    }
    const actual = (await readdir(lensRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    for (const id of IDS)
        if (!actual.includes(id))
            errors.push(`Missing lens: ${id}`);
    if (actual.length < IDS.length)
        errors.push(`Expected at least ${IDS.length} lenses, found ${actual.length}`);
    for (const id of actual) {
        const file = path.join(lensRoot, id, "LENS.md");
        if (!await pathExists(file)) {
            errors.push(`Missing LENS.md for ${id}`);
            continue;
        }
        const content = await readFile(file, "utf8");
        validateLens(errors, id, content);
    }
    const agentRoot = path.join(root, "platforms", "claude-code", "plugins", "friendly-adversary", "agents");
    const agents = (await readdir(agentRoot)).filter((file) => file.endsWith(".md")).map((file) => file.slice(0, -3));
    const workflowAgents = new Set(["audit-subsystem", "design-decision", "design-research", "design-challenge"]);
    for (const id of agents)
        if (!workflowAgents.has(id))
            errors.push(`Claude Code agent has no workflow role: ${id}`);
    for (const id of workflowAgents)
        if (!agents.includes(id))
            errors.push(`Missing Claude Code workflow agent: ${id}`);
    for (const platform of ["claude-code", "codex"]) {
        const skillRoot = path.join("platforms", platform, "plugins", "friendly-adversary", "skills", "pr-review");
        const skillRelative = path.join(skillRoot, "SKILL.md");
        const adjudicationRelative = path.join(skillRoot, "references", "adjudication.md");
        const skill = await readFile(path.join(root, skillRelative), "utf8");
        validateNonEditingSkillContract(errors, skillRelative, skill);
        validateOrchestrationSkillContract(errors, skillRelative, skill);
        if (platform === "codex")
            validateCodexForkIsolation(errors, skillRelative, skill);
        validateAdjudicationContract(errors, adjudicationRelative, await readFile(path.join(root, adjudicationRelative), "utf8"));
        const findingContractRelative = path.join(skillRoot, "references", "finding-contract.md");
        validateFindingContract(errors, findingContractRelative, await readFile(path.join(root, findingContractRelative), "utf8"));
        for (const skillName of ["audit-codebase", "design-new-codebase"]) {
            const supplementalRoot = path.join("platforms", platform, "plugins", "friendly-adversary", "skills", skillName);
            const supplementalRelative = path.join(supplementalRoot, "SKILL.md");
            const supplemental = await readFile(path.join(root, supplementalRelative), "utf8");
            const values = metadata(supplemental);
            if (values.name !== skillName)
                errors.push(`${supplementalRelative}: frontmatter name differs from path`);
            if (!values.description?.includes("Use only when the user explicitly invokes Friendly Adversary")) {
                errors.push(`${supplementalRelative}: must require explicit invocation`);
            }
            if (!supplemental.includes("record_artifact"))
                errors.push(`${supplementalRelative}: missing the single artifact tool contract`);
            if (!supplemental.includes("The establish operation retires the initial plan authority.")) {
                errors.push(`${supplementalRelative}: missing post-establish authority handoff requirement`);
            }
            if (skillName === "audit-codebase" && !supplemental.includes("Never dump `snapshot.json`")) {
                errors.push(`${supplementalRelative}: missing bounded machine-evidence instruction`);
            }
            if (platform === "codex" && !supplemental.includes('fork_turns="none"')) {
                errors.push(`${supplementalRelative}: missing empty-history workflow-agent requirement: fork_turns="none"`);
            }
            if (platform === "codex" && !supplemental.includes("return only the compact receipt")) {
                errors.push(`${supplementalRelative}: missing compact workflow-agent receipt requirement`);
            }
            if (skillName === "audit-codebase") {
                const required = "After the final subsystem starts, immediately wait for every subsystem result.";
                if (!supplemental.includes(required))
                    errors.push(`${supplementalRelative}: missing parallel-wait requirement: ${required}`);
                if (!supplemental.includes("Independently check inventory coverage and cross-subsystem contracts")) {
                    errors.push(`${supplementalRelative}: missing final adjudicator coverage and boundary checks`);
                }
            }
            if (skillName === "design-new-codebase" && !supplemental.includes("After the final challenge starts, immediately wait for every challenge result.")) {
                errors.push(`${supplementalRelative}: missing challenge parallel-wait requirement`);
            }
            if (skillName === "design-new-codebase" && !supplemental.includes("Treat the stated reference scope as an allowlist")) {
                errors.push(`${supplementalRelative}: missing authorized research allowlist requirement`);
            }
            if (skillName === "design-new-codebase" && !supplemental.includes("--revise <comma-separated-decision-ids>")) {
                errors.push(`${supplementalRelative}: missing batched decision revision requirement`);
            }
            if (skillName === "design-new-codebase" && platform === "codex" && !supplemental.includes("Each challenge returns only the compact receipt.")) {
                errors.push(`${supplementalRelative}: missing challenge compact-receipt requirement`);
            }
            if (platform === "claude-code" && values["disable-model-invocation"] !== "true") {
                errors.push(`${supplementalRelative}: Claude skill must disable model invocation`);
            }
        }
        const retiredRoot = path.join(root, "platforms", platform, "plugins", "friendly-adversary", "skills", "friendly-adversary");
        if (await pathExists(retiredRoot))
            errors.push(`${path.relative(root, retiredRoot)}: retired skill must not remain installed`);
    }
    const requiredFiles = ["LICENSE", "LICENSING.md", "prd.md", "docs/lens-authoring.md", "references/tooling.md", "references/adjudication.md", "references/audit-inventory.md", "references/audit-adjudication.md", "references/design-interview.md", "references/design-challenges.md", "scripts/enforce-public-release.mjs", "wasm/oxlint/engine.wasm", "wasm/oxlint/LICENSE-OXC-MIT.txt", "wasm/oxlint/UPSTREAM.md", "third-party/oxlint-wasm/NOTICE.md", "third-party/anti-slop/LICENSE.txt", "third-party/anti-slop/NOTICE.md", "third-party/cursor-team-kit/LICENSE.txt", "third-party/cursor-team-kit/NOTICE.md", "build/oxlint-wasm/Cargo.lock", "engines/ruff-wasm/runtime/ruff_wasm.js", "engines/ruff-wasm/runtime/ruff_wasm_bg.wasm", "engines/ruff-wasm/LICENSE", "engines/ruff-wasm/upstream-lock.json", "engines/ripgrep-wasm/runtime/rg.wasm", "engines/ripgrep-wasm/upstream-lock.json", "engines/ripgrep-wasm/SHA256SUMS", "engines/ripgrep-wasm/THIRD_PARTY_LICENSES.md", "engines/semgrep-wasm/runtime-manifest.json", "engines/semgrep-wasm/runtime/engine/semgrep-engine.wasm", "engines/semgrep-wasm/source/licenses/GENERATED-PARSERS-GPL-3.0.txt", "engines/semgrep-wasm/source/licenses/SEMGREP-LGPL-2.1.txt"];
    const requiredJson = [
        "evals/evals.json",
        ".agents/plugins/marketplace.json",
        "platforms/claude-code/plugins/friendly-adversary/.claude-plugin/plugin.json",
        "platforms/codex/plugins/friendly-adversary/.codex-plugin/plugin.json",
        "engines/semgrep-wasm/source/generated-parser-license-evidence.json",
        "platforms/claude-code/plugins/friendly-adversary/.mcp.json",
        "platforms/codex/plugins/friendly-adversary/.mcp.json",
    ];
    for (const required of [...requiredFiles, ...requiredJson])
        if (!await pathExists(path.join(root, required)))
            errors.push(`Missing required file: ${required}`);
    for (const file of requiredJson) {
        try {
            JSON.parse(await readFile(path.join(root, file), "utf8"));
        }
        catch (error) {
            errors.push(`${file}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
        }
    }
    for (const platform of ["claude-code", "codex"]) {
        const relative = `platforms/${platform}/plugins/friendly-adversary/.mcp.json`;
        try {
            errors.push(...validateMcpManifestContract(platform, JSON.parse(await readFile(path.join(root, relative), "utf8"))));
        }
        catch {
            // The required JSON pass already records missing or malformed manifests.
        }
    }
    try {
        const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
        if (packageJson.private !== true)
            errors.push("package.json must set private to true");
        if (packageJson.license !== "GPL-3.0-only")
            errors.push("package.json must declare GPL-3.0-only");
        if (packageJson.scripts?.prepublishOnly !== "node scripts/enforce-public-release.mjs block") {
            errors.push("package.json must retain the unconditional publication blocker");
        }
    }
    catch (error) {
        errors.push(`package.json: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    }
    await validateOxlintArtifact(errors, root, "wasm/oxlint/engine.wasm");
    await validateRuffArtifact(errors, root);
    await validateRipgrepArtifact(errors, root);
    await validateRipgrepDistribution(errors, root);
    await validateThirdPartyNotices(errors, root);
    await validatePortableFiles(errors, root);
    if (errors.length)
        throw new FriendlyAdversaryError(`Repository validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`, 2);
    return [`Validated ${actual.length} lenses`, `Validated ${agents.length} Claude Code agents`, "Validated platform manifests and product files"];
}
//# sourceMappingURL=validate.js.map