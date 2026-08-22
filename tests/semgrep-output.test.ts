import assert from "node:assert/strict";
import test from "node:test";
import { validateSemgrepRunOutput } from "../src/semgrep-output.js";

test("Semgrep output validation accepts complete error-free coverage", () => {
  const output = JSON.stringify({ errors: [], paths: { scanned: ["src/app.ts", "src/tool.py"] } });
  assert.equal(validateSemgrepRunOutput(output, ["src/app.ts", "src/tool.py"]), undefined);
});

test("Semgrep output validation fails closed on scan errors", () => {
  const output = JSON.stringify({ errors: [{ message: "parser failed" }], paths: { scanned: ["src/app.ts"] } });
  assert.equal(
    validateSemgrepRunOutput(output, ["src/app.ts"]),
    "Semgrep reported 1 scan error (<unknown>: parser failed)",
  );
});

test("Semgrep output validation identifies stack-limited uncovered targets", () => {
  const output = JSON.stringify({
    errors: [{ message: "Stack_overflow", location: { path: "backend/crm/tests.py" } }],
    paths: { scanned: ["backend/crm/tests.py"] },
  });
  assert.equal(
    validateSemgrepRunOutput(output, ["backend/crm/tests.py"]),
    "Semgrep reported 1 scan error (backend/crm/tests.py: engine stack limit exceeded; target not covered)",
  );
});

test("Semgrep output validation fails closed on missing target coverage", () => {
  const output = JSON.stringify({ errors: [], paths: { scanned: ["src/app.ts"] } });
  assert.equal(
    validateSemgrepRunOutput(output, ["src/app.ts", "src/tool.py"]),
    "Semgrep did not report 1 target as scanned: src/tool.py",
  );
});

test("Semgrep output validation fails closed on malformed output", () => {
  assert.match(validateSemgrepRunOutput("not json", ["src/app.ts"]) ?? "", /emitted invalid JSON/u);
  assert.equal(validateSemgrepRunOutput("{}", ["src/app.ts"]), "Semgrep emitted an invalid result shape");
});
