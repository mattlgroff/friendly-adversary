import assert from "node:assert/strict";
import test from "node:test";
import { renderMarkdownReport } from "../src/report-html.js";

test("offline report HTML escapes source examples and renders tables without external assets", () => {
  const html = renderMarkdownReport(`# Report

| Priority | Finding |
| --- | --- |
| High | Escapes source |

\`\`\`html
<script>alert("example")</script>
\`\`\`
`);
  assert.match(html, /<table>/u);
  assert.match(html, /&lt;script&gt;alert\(&quot;example&quot;\)&lt;\/script&gt;/u);
  assert.doesNotMatch(html, /<script>alert/u);
  assert.match(html, /default-src 'none'/u);
  assert.doesNotMatch(html, /https?:\/\//u);
});

test("offline report HTML rejects credential-like material", () => {
  assert.throws(() => renderMarkdownReport("# Report\n\nAKIAABCDEFGHIJKLMNOP"), /FA_HTML_SECRET/u);
  assert.throws(() => renderMarkdownReport("# Report\n\npostgres://user:secret@example.com/db"), /FA_HTML_SECRET/u);
});
