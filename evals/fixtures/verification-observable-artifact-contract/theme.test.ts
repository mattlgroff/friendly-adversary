import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships the documented dark theme tokens", async () => {
  const css = await readFile(new URL("./theme.css", import.meta.url), "utf8");

  assert.match(css, /color-scheme: dark/u);
  assert.match(css, /--app-surface: #111827/u);
  assert.match(css, /--app-text: #f9fafb/u);
});
