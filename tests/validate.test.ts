import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { validateMcpManifestContract, validateRepository } from "../src/validate.js";

test("generated Codex and Claude Code skill bundles validate in installed layout", async () => {
  for (const platform of ["codex", "claude-code"]) {
    const root = path.resolve("platforms", platform, "plugins", "friendly-adversary", "skills", "pr-review");
    const result = await validateRepository(root);
    assert.ok(result.includes("Validated 9 bundled lenses"));
    assert.ok(result.includes("Validated plugin runtime and review contracts"));
  }
});

test("installed skill validation rejects a weakened non-editing contract", async () => {
  const source = path.resolve("platforms", "claude-code", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-non-editing-contract-"));
  try {
    const root = path.join(parent, "skill");
    await cp(source, root, { recursive: true });
    const skillPath = path.join(root, "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    await writeFile(skillPath, skill.replace("Never add or modify `.gitignore`", "You may update `.gitignore`"));
    await assert.rejects(() => validateRepository(root), /missing non-editing requirement: Never add or modify `\.gitignore`/u);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("installed skill validation rejects weakened parallel-wait and context bounds", async () => {
  const source = path.resolve("platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-orchestration-contract-"));
  try {
    const root = path.join(parent, "skill");
    await cp(source, root, { recursive: true });
    const skillPath = path.join(root, "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    await writeFile(skillPath, skill
      .replace("Every lens must run through the installed local Codex CLI with `gpt-5.6-luna`, `high` reasoning, and `fast` service tier.", "Use any available model.")
      .replace("Do not let a lens inherit the parent conversation or original skill invocation.", "Reuse the parent conversation.")
      .replace("Never recursively inventory the installed plugin or skill tree.", "Inspect the plugin tree."));
    await assert.rejects(
      () => validateRepository(root),
      /missing orchestration requirement: (?:Every lens must run through|Do not let a lens inherit|Never recursively inventory)/u,
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("installed Codex skill validation prohibits native lens subagents", async () => {
  const source = path.resolve("platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-codex-fork-isolation-"));
  try {
    const root = path.join(parent, "skill");
    await cp(source, root, { recursive: true });
    const skillPath = path.join(root, "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    await writeFile(skillPath, skill.replace("Do not spawn a subagent for a lens.", "Spawn a subagent for a lens."));
    await assert.rejects(
      () => validateRepository(root),
      /missing prohibition on Codex lens subagents/u,
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("installed Codex skill validation requires an escalated collector launch", async () => {
  const source = path.resolve("platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-codex-collector-sandbox-"));
  try {
    const root = path.join(parent, "skill");
    await cp(source, root, { recursive: true });
    const skillPath = path.join(root, "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    const weakened = skill
      .replace('sandbox_permissions: "require_escalated"', 'sandbox_permissions: "use_default"')
      .concat('\nA non-workflow note mentions sandbox_permissions: "require_escalated".\n');
    await writeFile(skillPath, weakened);
    await assert.rejects(
      () => validateRepository(root),
      /missing required escalated collector launch/u,
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("installed Codex skill validation requires disclosure of the escalated collector scope", async () => {
  const source = path.resolve("platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-codex-collector-disclosure-"));
  try {
    const root = path.join(parent, "skill");
    await cp(source, root, { recursive: true });
    const skillPath = path.join(root, "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    await writeFile(skillPath, skill.replace("The escalation applies to the collector and repository-owned checks, so proceed only for the trusted repository required by this skill. ", ""));
    await assert.rejects(
      () => validateRepository(root),
      /missing required escalated collector launch/u,
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("installed Codex skill validation prohibits duplicate long-running collectors", async () => {
  const source = path.resolve("platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-codex-collector-retry-"));
  try {
    const root = path.join(parent, "skill");
    await cp(source, root, { recursive: true });
    const skillPath = path.join(root, "SKILL.md");
    const skill = await readFile(skillPath, "utf8");
    await writeFile(skillPath, skill.replace("never invoke `review` again", "invoke `review` again"));
    await assert.rejects(
      () => validateRepository(root),
      /missing Codex long-running collector retry prohibition/u,
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("installed skill validation rejects adjudication that can overstate evidence", async () => {
  const source = path.resolve("platforms", "claude-code", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-adjudication-contract-"));
  try {
    const root = path.join(parent, "skill");
    await cp(source, root, { recursive: true });
    const adjudicationPath = path.join(root, "references", "adjudication.md");
    const adjudication = await readFile(adjudicationPath, "utf8");
    await writeFile(adjudicationPath, adjudication.replace(
      "The report summary must not be stronger or less qualified than the supporting adjudication.",
      "Summarize the adjudication.",
    ));
    await assert.rejects(
      () => validateRepository(root),
      /missing adjudication requirement: The report summary must not be stronger or less qualified/u,
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("installed skill validation rejects a finding contract that asks agents for tool-owned metadata", async () => {
  const source = path.resolve("platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-finding-contract-"));
  try {
    const root = path.join(parent, "skill");
    await cp(source, root, { recursive: true });
    const contractPath = path.join(root, "references", "finding-contract.md");
    const contract = await readFile(contractPath, "utf8");
    await writeFile(contractPath, contract.replace(
      "Submit only the lens analysis body. Do not include `- Model:`, `- Effort:`, or `- Host:` lines because the report tool adds those immutable run-plan values to the persisted report.",
      "Start every lens report with this metadata: `- Model:`, `- Effort:`, and `- Host:`.",
    ));
    await assert.rejects(
      () => validateRepository(root),
      /(?:missing tool-owned metadata instruction|contradicts tool-owned metadata publication)/u,
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("repository validation does not require a Python interpreter", async () => {
  const packageJson = JSON.parse(await readFile(path.resolve("package.json"), "utf8")) as { scripts?: Record<string, string> };
  assert.match(packageJson.scripts?.validate ?? "", /node dist\/src\/cli\.js validate --root \./u);
  assert.doesNotMatch(packageJson.scripts?.validate ?? "", /python/u);
  assert.match(packageJson.scripts?.validate ?? "", /npm run check:plugins/u);
});

test("host MCP manifests preserve the exact stdio launch contract", async () => {
  for (const platform of ["claude-code", "codex"] as const) {
    const manifest = JSON.parse(await readFile(path.resolve("platforms", platform, "plugins", "friendly-adversary", ".mcp.json"), "utf8"));
    assert.deepEqual(validateMcpManifestContract(platform, manifest), []);
    const server = platform === "claude-code" ? manifest.mcpServers["friendly-adversary-reports"] : manifest["friendly-adversary-reports"];
    server.args = [...server.args, "--inspect"];
    assert.match(validateMcpManifestContract(platform, manifest)[0] ?? "", /differs from the required stdio contract/u);
  }
});

test("generated plugin runtimes match the freshly built canonical outputs", async () => {
  const runtimeFiles = (await readdir(path.resolve("dist", "src")))
    .filter((file) => file.endsWith(".js") && !file.startsWith("lens-report-mcp"));
  const sources = [
    ...runtimeFiles.map((file) => ({ source: path.join("dist", "src", file), target: file })),
    { source: path.join("dist", "mcp", "friendly-adversary-mcp.cjs"), target: "friendly-adversary-mcp.cjs" },
    { source: path.join("dist", "mcp", "bundle-manifest.json"), target: "bundle-manifest.json" },
  ];
  for (const platform of ["claude-code", "codex"]) {
    const skillRoot = path.resolve("platforms", platform, "plugins", "friendly-adversary", "skills", "pr-review");
    const runtime = path.join(skillRoot, "scripts", "runtime");
    assert.deepEqual(
      JSON.parse(await readFile(path.join(skillRoot, "package.json"), "utf8")),
      { name: "friendly-adversary-skill-runtime", private: true, type: "module" },
      `${platform} skill runtime package metadata is stale`,
    );
    for (const entry of sources) {
      assert.deepEqual(
        await readFile(path.join(runtime, entry.target)),
        await readFile(path.resolve(entry.source)),
        `${platform} runtime is stale: ${entry.target}`,
      );
    }
  }
});

test("platform asset validation rejects stale bytes and file inventories", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-platform-parity-"));
  const source = path.join(parent, "source");
  const target = path.join(parent, "target");
  try {
    await mkdir(path.join(source, "nested"), { recursive: true });
    await writeFile(path.join(source, "nested", "rule.yml"), "rule\n");
    await cp(source, target, { recursive: true });
    const checker = await import(pathToFileURL(path.resolve("scripts", "check-platform-assets.mjs")).href) as {
      assertFileEqual(sourceFile: string, targetFile: string, label: string): Promise<void>;
      assertTreeEqual(sourceRoot: string, targetRoot: string, label: string): Promise<number>;
      assertExactInventory(actual: string[], expected: string[], label: string): void;
    };
    assert.ok(await checker.assertTreeEqual(source, target, "fixture") > 0);
    await writeFile(path.join(target, "nested", "rule.yml"), "stale\n");
    await assert.rejects(checker.assertTreeEqual(source, target, "fixture"), /is stale/u);
    await cp(source, target, { recursive: true, force: true });
    await writeFile(path.join(target, "extra.yml"), "extra\n");
    await assert.rejects(checker.assertTreeEqual(source, target, "fixture"), /stale file inventory/u);
    assert.throws(
      () => checker.assertExactInventory(["bundle.js", "obsolete"], ["bundle.js"], "runtime root"),
      /stale file inventory/u,
    );
    const canonicalContract = path.resolve("references", "finding-contract.md");
    const copiedContract = path.join(parent, "finding-contract.md");
    await cp(canonicalContract, copiedContract);
    await checker.assertFileEqual(canonicalContract, copiedContract, "finding contract");
    await writeFile(copiedContract, "drifted contract\n");
    await assert.rejects(checker.assertFileEqual(canonicalContract, copiedContract, "finding contract"), /is stale/u);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("installed bundle validation rejects artifact, notice, and native-runtime tampering", async () => {
  const source = path.resolve("platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-bundle-integrity-"));
  try {
    const moduleType = path.join(parent, "module-type");
    await cp(source, moduleType, { recursive: true });
    await writeFile(path.join(moduleType, "package.json"), "{\"private\":true,\"type\":\"commonjs\"}\n");
    await assert.rejects(() => validateRepository(moduleType), /must mark the installed skill runtime as an ES module/u);

    const artifact = path.join(parent, "artifact");
    await cp(source, artifact, { recursive: true });
    const engine = path.join(artifact, "scripts", "runtime", "wasm", "oxlint", "engine.wasm");
    const altered = Buffer.from(await readFile(engine));
    const lastByte = altered.length - 1;
    altered[lastByte] = altered[lastByte]! ^ 1;
    await writeFile(engine, altered);
    await assert.rejects(() => validateRepository(artifact), /SHA-256 .* does not match/);

    const ruffArtifact = path.join(parent, "ruff-artifact");
    await cp(source, ruffArtifact, { recursive: true });
    const ruffEngine = path.join(ruffArtifact, "engines", "ruff-wasm", "runtime", "ruff_wasm_bg.wasm");
    const alteredRuff = Buffer.from(await readFile(ruffEngine));
    alteredRuff[alteredRuff.length - 1] = alteredRuff[alteredRuff.length - 1]! ^ 1;
    await writeFile(ruffEngine, alteredRuff);
    await assert.rejects(() => validateRepository(ruffArtifact), /engines\/ruff-wasm\/runtime\/ruff_wasm_bg\.wasm: SHA-256 .* does not match/);

    const ripgrepArtifact = path.join(parent, "ripgrep-artifact");
    await cp(source, ripgrepArtifact, { recursive: true });
    const ripgrepEngine = path.join(ripgrepArtifact, "engines", "ripgrep-wasm", "runtime", "rg.wasm");
    const alteredRipgrep = Buffer.from(await readFile(ripgrepEngine));
    alteredRipgrep[alteredRipgrep.length - 1] = alteredRipgrep[alteredRipgrep.length - 1]! ^ 1;
    await writeFile(ripgrepEngine, alteredRipgrep);
    await assert.rejects(() => validateRepository(ripgrepArtifact), /engines\/ripgrep-wasm\/runtime\/rg\.wasm: SHA-256 .* does not match/);

    const ripgrepNotice = path.join(parent, "ripgrep-notice");
    await cp(source, ripgrepNotice, { recursive: true });
    await writeFile(
      path.join(ripgrepNotice, "engines", "ripgrep-wasm", "licenses", "rust-1.97.1", "LICENSE-MIT"),
      "altered\n",
    );
    await assert.rejects(() => validateRepository(ripgrepNotice), /engines\/ripgrep-wasm\/licenses\/rust-1\.97\.1\/LICENSE-MIT: missing or mismatched checksum/);

    const native = path.join(parent, "native");
    await cp(source, native, { recursive: true });
    await writeFile(path.join(native, "scripts", "runtime", "extensionless-native"), Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x00]));
    await assert.rejects(() => validateRepository(native), /forbidden native executable signature/);

    const notices = path.join(parent, "notices");
    await cp(source, notices, { recursive: true });
    const notice = path.join(notices, "third-party", "oxlint-wasm", "NOTICE.md");
    await writeFile(notice, `${await readFile(notice, "utf8")}altered\n`);
    await assert.rejects(() => validateRepository(notices), /missing or mismatched checksum/);

    const incompatible = path.join(parent, "incompatible-license");
    await cp(source, incompatible, { recursive: true });
    const incompatibleNotice = path.join(incompatible, "third-party", "oxlint-wasm", "NOTICE.md");
    const changedNotice = (await readFile(incompatibleNotice, "utf8"))
      .replace(
        "| `Apache-2.0 OR GPL-2.0-only` | `Apache-2.0` |",
        "| `GPL-2.0-only` | `Apache-2.0` |",
      )
      .replace(
        "| self_cell | 1.3.0 | Apache-2.0 OR GPL-2.0-only |",
        "| self_cell | 1.3.0 | GPL-2.0-only |",
      );
    await writeFile(incompatibleNotice, changedNotice);
    const sums = path.join(incompatible, "third-party", "oxlint-wasm", "SHA256SUMS");
    const digest = createHash("sha256").update(changedNotice).digest("hex");
    await writeFile(sums, (await readFile(sums, "utf8")).replace(/^[a-f0-9]{64}  NOTICE\.md$/mu, `${digest}  NOTICE.md`));
    await assert.rejects(() => validateRepository(incompatible), /unexpected license expression GPL-2\.0-only/);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("lens validation rejects documented contract violations", async () => {
  const source = path.resolve("platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review");
  const parent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-lens-contract-"));
  const cases = [
    { name: "heading", mutate: (content: string) => content.replace("# Correctness", "# Different"), error: /first body heading/ },
    { name: "languages", mutate: (content: string) => content.replace("languages: [typescript, javascript, python]", "languages: [ruby]"), error: /supported language identifiers/ },
    { name: "list", mutate: (content: string) => content.replace("applies_to: [logic, api, ui, worker, cli]", "applies_to: all"), error: /applies_to must be/ },
    { name: "length", mutate: (content: string) => `${content}${"extra\n".repeat(251)}`, error: /250-line limit/ },
    { name: "example", mutate: (content: string) => content.replace(/## Valid finding example\n\n[\s\S]*?\n\n## Invalid finding example/, "## Valid finding example\n\n## Invalid finding example"), error: /valid finding example is empty/ },
  ];
  try {
    for (const reviewCase of cases) {
      const root = path.join(parent, reviewCase.name);
      await cp(source, root, { recursive: true });
      const lens = path.join(root, "references", "lenses", "correctness.md");
      await writeFile(lens, reviewCase.mutate(await readFile(lens, "utf8")));
      await assert.rejects(() => validateRepository(root), reviewCase.error);
    }
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
