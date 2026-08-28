import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("verification lens requires independent, defect-sensitive test oracles", async () => {
  const content = await readFile(path.resolve("lenses", "verification", "LENS.md"), "utf8");

  assert.match(content, /^version: 1$/mu);
  assert.match(content, /tautological oracle derived from the same implementation/u);
  assert.match(content, /Trace the expected value or oracle to an independent requirement/u);
  assert.match(content, /Perform a defect-sensitivity thought experiment/u);
  assert.match(content, /Report a tautological test only when you can identify the shared oracle/u);
  assert.match(content, /A tautological or disconnected test is a finding only when it creates false confidence/u);
});

test("verification evaluation catalog covers a tautology and a valid artifact contract", async () => {
  const catalog = JSON.parse(await readFile(path.resolve("evals", "evals.json"), "utf8")) as {
    cases: Array<{ id: string; status: string; fixture?: string; applicable_lenses: string[]; expected_behavior: string[] }>;
  };
  const tautology = catalog.cases.find((entry) => entry.id === "verification-tautological-oracle");
  const artifact = catalog.cases.find((entry) => entry.id === "verification-observable-artifact-contract");

  assert.deepEqual(tautology?.applicable_lenses, ["verification"]);
  assert.equal(tautology?.status, "fixture-ready");
  assert.ok(tautology?.expected_behavior.some((behavior) => behavior.includes("remains green")));
  assert.deepEqual(artifact?.applicable_lenses, ["verification"]);
  assert.equal(artifact?.status, "fixture-ready");
  assert.ok(artifact?.expected_behavior.some((behavior) => behavior.includes("Does not label every snapshot")));
  await access(path.resolve(tautology?.fixture ?? "missing", "contract.md"));
  await access(path.resolve(tautology?.fixture ?? "missing", "invoice.test.ts"));
  await access(path.resolve(artifact?.fixture ?? "missing", "contract.md"));
  await access(path.resolve(artifact?.fixture ?? "missing", "theme.test.ts"));
});

test("codebase audit routes test-owning subsystems through the verification lens", async () => {
  const inventory = await readFile(path.resolve("references", "audit-inventory.md"), "utf8");
  assert.match(inventory, /must include the `verification` dimension/u);
  assert.match(inventory, /independently sourced oracle/u);

  for (const platform of ["claude-code", "codex"]) {
    const skill = await readFile(path.resolve(
      "platforms",
      platform,
      "plugins",
      "friendly-adversary",
      "skills",
      "audit-codebase",
      "SKILL.md",
    ), "utf8");
    assert.match(skill, /read `references\/lenses\/verification\.md`/u);
    assert.match(skill, /Include the exact verification lens text/u);
  }
});
