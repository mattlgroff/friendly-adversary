import { readFile } from "node:fs/promises";
import path from "node:path";
import { FriendlyAdversaryError } from "./errors.js";
import { writeFileAtomic } from "./fs-utils.js";
import { detectRecognizableSecret } from "./secret-patterns.js";
function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function inline(value) {
    const escaped = escapeHtml(value);
    return escaped
        .replace(/`([^`]+)`/gu, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, (_match, label, target) => {
        const safe = /^(?:https?:\/\/|\.\/|\.\.\/|#)/u.test(target) ? target : "#";
        return `<a href="${escapeHtml(safe)}" rel="noreferrer">${label}</a>`;
    });
}
function slug(value, used) {
    const base = value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "") || "section";
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate))
        candidate = `${base}-${suffix++}`;
    used.add(candidate);
    return candidate;
}
function tableCells(line) {
    return line.trim().replace(/^\||\|$/gu, "").split("|").map((cell) => cell.trim());
}
export function renderMarkdownReport(markdown, title = "Friendly Adversary report") {
    if (detectRecognizableSecret(markdown))
        throw new FriendlyAdversaryError("FA_HTML_SECRET: report Markdown contains credential-like material", 2);
    const lines = markdown.replaceAll("\r\n", "\n").split("\n");
    const body = [];
    const navigation = [];
    const used = new Set();
    let list;
    let code = false;
    let codeLanguage = "";
    const closeList = () => { if (list)
        body.push(`</${list}>`); list = undefined; };
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index] ?? "";
        if (line.startsWith("```")) {
            closeList();
            if (code)
                body.push("</code></pre>");
            else {
                codeLanguage = line.slice(3).trim().replace(/[^a-z0-9_-]/giu, "");
                body.push(`<pre data-language="${escapeHtml(codeLanguage)}"><code>`);
            }
            code = !code;
            continue;
        }
        if (code) {
            body.push(`${escapeHtml(line)}\n`);
            continue;
        }
        const tableDivider = lines[index + 1] ?? "";
        if (line.includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/u.test(tableDivider)) {
            closeList();
            const headers = tableCells(line);
            body.push(`<div class="table-wrap"><table><thead><tr>${headers.map((cell) => `<th scope="col">${inline(cell)}</th>`).join("")}</tr></thead><tbody>`);
            index += 2;
            while (index < lines.length && (lines[index] ?? "").includes("|") && (lines[index] ?? "").trim()) {
                const cells = tableCells(lines[index] ?? "");
                body.push(`<tr>${headers.map((_header, cellIndex) => `<td>${inline(cells[cellIndex] ?? "")}</td>`).join("")}</tr>`);
                index += 1;
            }
            index -= 1;
            body.push("</tbody></table></div>");
            continue;
        }
        const heading = /^(#{1,6})\s+(.+)$/u.exec(line);
        if (heading) {
            closeList();
            const level = heading[1]?.length ?? 1;
            const label = heading[2] ?? "Section";
            const id = slug(label, used);
            navigation.push({ level, id, label });
            body.push(`<h${level} id="${id}">${inline(label)}</h${level}>`);
            continue;
        }
        const unordered = /^\s*[-*]\s+(.+)$/u.exec(line);
        const ordered = /^\s*\d+\.\s+(.+)$/u.exec(line);
        if (unordered || ordered) {
            const next = unordered ? "ul" : "ol";
            if (list !== next) {
                closeList();
                list = next;
                body.push(`<${next}>`);
            }
            body.push(`<li>${inline((unordered ?? ordered)?.[1] ?? "")}</li>`);
            continue;
        }
        closeList();
        if (!line.trim())
            continue;
        if (/^>\s?/u.test(line))
            body.push(`<blockquote>${inline(line.replace(/^>\s?/u, ""))}</blockquote>`);
        else if (/^---+$/u.test(line.trim()))
            body.push("<hr>");
        else
            body.push(`<p>${inline(line)}</p>`);
    }
    closeList();
    if (code)
        throw new FriendlyAdversaryError("FA_HTML_MARKDOWN_INVALID: report contains an unclosed code fence", 2);
    const toc = navigation.filter((entry) => entry.level <= 3).map((entry) => `<li class="l${entry.level}"><a href="#${entry.id}">${escapeHtml(entry.label)}</a></li>`).join("");
    const safeTitle = escapeHtml(title);
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'unsafe-inline'"><title>${safeTitle}</title><style>
:root{font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.55;color-scheme:light dark;--accent:#6d5dfc;--panel:color-mix(in srgb,Canvas 94%,CanvasText 6%)}body{margin:0;background:Canvas;color:CanvasText}.layout{display:grid;grid-template-columns:minmax(14rem,22rem) minmax(0,60rem);gap:2rem;max-width:88rem;margin:auto;padding:2rem}.toc{position:sticky;top:1rem;align-self:start;max-height:calc(100vh - 2rem);overflow:auto;background:var(--panel);border-radius:.8rem;padding:1rem}.toc ul{list-style:none;padding:0}.toc .l2{padding-left:.75rem}.toc .l3{padding-left:1.5rem}.toc a{color:inherit;text-decoration:none}.toc a:hover,.toc a:focus{text-decoration:underline}main{min-width:0}h1,h2,h3{line-height:1.2;scroll-margin-top:1rem}h2{margin-top:2.2rem;border-bottom:1px solid color-mix(in srgb,CanvasText 18%,transparent);padding-bottom:.35rem}code,pre{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}code{background:var(--panel);padding:.12rem .3rem;border-radius:.25rem}pre{background:var(--panel);padding:1rem;border-radius:.6rem;overflow:auto}blockquote{border-left:.25rem solid var(--accent);margin-left:0;padding:.5rem 1rem;background:var(--panel)}a{color:var(--accent)}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%}th,td{border:1px solid color-mix(in srgb,CanvasText 22%,transparent);padding:.5rem;text-align:left;vertical-align:top}th{background:var(--panel)}.filter{width:100%;box-sizing:border-box;padding:.6rem;border:1px solid color-mix(in srgb,CanvasText 25%,transparent);border-radius:.4rem;background:Canvas;color:CanvasText}@media(max-width:800px){.layout{display:block;padding:1rem}.toc{position:static;max-height:none;margin-bottom:1rem}}@media print{.toc,.filter{display:none}.layout{display:block;max-width:none;padding:0}a{color:inherit}}
</style></head><body><div class="layout"><nav class="toc" aria-label="Report sections"><label for="section-filter">Find a section</label><input class="filter" id="section-filter" type="search" placeholder="Filter headings"><ul id="toc-list">${toc}</ul></nav><main>${body.join("\n")}</main></div><script>
const input=document.getElementById('section-filter');const items=[...document.querySelectorAll('#toc-list li')];input?.addEventListener('input',()=>{const q=input.value.toLowerCase();for(const item of items)item.hidden=!item.textContent.toLowerCase().includes(q)});
</script></body></html>\n`;
}
export async function writeHtmlCompanion(runDirectory, markdownName = "report.md", htmlName = "report.html", title) {
    const markdown = await readFile(path.join(runDirectory, markdownName), "utf8");
    await writeFileAtomic(path.join(runDirectory, htmlName), renderMarkdownReport(markdown, title));
}
//# sourceMappingURL=report-html.js.map