import { randomBytes } from "node:crypto";
import { link, lstat, open, readFile, readdir, realpath, unlink } from "node:fs/promises";
import path from "node:path";
import { validateReviewAuthority, } from "./authority.js";
import { RECEIPT_FILE } from "./constants.js";
import { FriendlyAdversaryError } from "./errors.js";
import { readJson, sha256 } from "./fs-utils.js";
import { detectRecognizableSecret } from "./secret-patterns.js";
export const LENS_COMPLETE = "<!-- friendly-adversary:lens-complete -->";
export const DOCUMENT_COMPLETE = "<!-- friendly-adversary:complete -->";
export const INCOMPLETE_STATUS = "<!-- friendly-adversary:incomplete-status -->";
const OUTCOME_REPORT_SHA256 = "friendly-adversary:outcome-report-sha256";
export const MAX_LENS_REPORT_BYTES = 512 * 1024;
export const MAX_OUTCOME_DOCUMENT_BYTES = 1024 * 1024;
const LENS_FINDING_FIELDS = [
    "Failure class",
    "Property violated",
    "Location",
    "Evidence",
    "Failure path",
    "Impact",
    "Disproof attempted",
    "Uncertainty",
];
function fail(code, message, exitCode = 2) {
    throw new FriendlyAdversaryError(`${code}: ${message}`, exitCode);
}
function markdownOutsideFences(content) {
    let fence;
    return content.split(/\r?\n/u).map((line) => {
        if (fence) {
            const closing = /^ {0,3}(`+|~+)[\t ]*$/u.exec(line);
            if (closing?.[1]?.[0] === fence.marker && closing[1].length >= fence.length)
                fence = undefined;
            return "";
        }
        const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
        if (!opening)
            return line;
        const marker = opening[1][0];
        if (marker === "`" && opening[2]?.includes("`"))
            return line;
        fence = { marker, length: opening[1].length };
        return "";
    }).join("\n");
}
function markdownOutsideHtmlComments(content) {
    let visible = "";
    let cursor = 0;
    while (cursor < content.length) {
        const opening = content.indexOf("<!--", cursor);
        if (opening < 0)
            return visible + content.slice(cursor);
        visible += content.slice(cursor, opening);
        const closing = content.indexOf("-->", opening + 4);
        if (closing < 0)
            return visible;
        cursor = closing + 3;
    }
    return visible;
}
function markdownOutsideIndentedCode(content) {
    let indented = false;
    return content.split(/\r?\n/u).map((line) => {
        if (/^(?: {4}|\t)/u.test(line)) {
            indented = true;
            return "";
        }
        if (indented && line.trim() === "")
            return "";
        indented = false;
        return line;
    }).join("\n");
}
export function markdownOperativeText(content) {
    return markdownOutsideIndentedCode(markdownOutsideFences(markdownOutsideHtmlComments(content)));
}
export function detectReportSecret(content) {
    return detectRecognizableSecret(content);
}
export function validateLensReportContract(content, file) {
    const markdown = markdownOutsideFences(content);
    const priorityHeading = /^#{1,6}\s+(?:\[P[0-3]\]|(?:critical|high|medium|low)(?=\s*[:-]))/imu;
    const adjudicatorField = /^-\s*(?:priority|severity|confidence):/imu;
    const toolOwnedMetadata = /^-\s*(?:model|effort|host):/imu;
    const supportedFindingsHeading = /^# Supported findings\s*$/imu;
    if (toolOwnedMetadata.test(markdown)) {
        fail("FA_REPORT_CONTRACT_INVALID", `${file} includes tool-owned model metadata. Submit only the lens analysis body.`);
    }
    if (priorityHeading.test(markdown) || adjudicatorField.test(markdown)) {
        fail("FA_REPORT_CONTRACT_INVALID", `${file} assigns priority, severity, or confidence. Only final adjudication may triage findings.`);
    }
    if (supportedFindingsHeading.test(markdown)) {
        fail("FA_REPORT_CONTRACT_INVALID", `${file} includes the forbidden '# Supported findings' heading. Start directly with structured '###' findings.`);
    }
    const noFindings = /^# No supported findings\s*$/mu.test(markdown);
    const abstained = /^# Abstained\s*$/mu.test(markdown);
    if (noFindings && abstained) {
        fail("FA_REPORT_CONTRACT_INVALID", `${file} cannot declare both no supported findings and abstention`);
    }
    const findingSections = markdown.split(/^###\s+/mu).slice(1);
    if (noFindings || abstained) {
        if (findingSections.length) {
            fail("FA_REPORT_CONTRACT_INVALID", `${file} appends level-three finding sections after a terminal no-finding or abstention outcome`);
        }
        const terminalHeading = noFindings ? /^# No supported findings\s*$/mu : /^# Abstained\s*$/mu;
        const visibleRationale = markdownOutsideHtmlComments(markdown.replace(terminalHeading, "")).trim();
        if (!visibleRationale) {
            fail("FA_REPORT_CONTRACT_INVALID", `${file} must explain what was inspected or why the lens abstained`);
        }
        return;
    }
    if (!findingSections.length) {
        fail("FA_REPORT_CONTRACT_INVALID", `${file} must declare '# No supported findings', '# Abstained', or structured '###' findings`);
    }
    for (const section of findingSections) {
        const title = section.split("\n", 1)[0]?.trim() || "untitled finding";
        const lines = section.split(/\r?\n/u);
        for (const field of LENS_FINDING_FIELDS) {
            const fieldPrefix = `- ${field}:`;
            const matches = lines.filter((line) => line.startsWith(fieldPrefix));
            if (matches.length !== 1 || !matches[0]?.slice(fieldPrefix.length).trim()) {
                fail("FA_REPORT_CONTRACT_INVALID", `${file} finding '${title}' is missing '- ${field}: <value>'`);
            }
            const fieldIndex = lines.indexOf(matches[0] ?? "");
            if (/^[\t ]+\S/u.test(lines[fieldIndex + 1] ?? "")) {
                fail("FA_REPORT_CONTRACT_INVALID", `${file} finding '${title}' wraps '- ${field}: <value>' onto an indented continuation line`);
            }
        }
    }
}
export function validatePersistedLensReportContract(content, file) {
    const envelope = /^- Model:\s*[^\r\n]+\r?\n- Effort:\s*[^\r\n]+\r?\n- Host:\s*[^\r\n]+\r?\n\r?\n/u.exec(content);
    if (!envelope)
        fail("FA_LENS_REPORT_INVALID", `${file} must record '- Model: <value>', '- Effort: <value>', and '- Host: <value>' in its tool-owned metadata envelope`);
    const markerIndex = content.lastIndexOf(LENS_COMPLETE);
    if (markerIndex < envelope[0].length)
        fail("FA_LENS_REPORT_INCOMPLETE", `${file} lacks its lens completion marker`);
    validateLensReportContract(content.slice(envelope[0].length, markerIndex).trim(), file);
}
function throwIfCancelled(signal) {
    if (signal?.aborted)
        fail("FA_CANCELLED", "tool call was cancelled before publication", 3);
}
function validateBody(body, name, maximumBytes, allowedControlMarkers = []) {
    const normalized = body.trim();
    if (!normalized)
        fail("FA_REPORT_CONTRACT_INVALID", `${name} must not be empty`);
    let untrustedMarkers = normalized;
    let duplicateAllowedMarker = false;
    for (const marker of allowedControlMarkers) {
        const occurrences = untrustedMarkers.split(marker).length - 1;
        if (occurrences > 1)
            duplicateAllowedMarker = true;
        untrustedMarkers = untrustedMarkers.replaceAll(marker, "");
    }
    if (duplicateAllowedMarker || untrustedMarkers.includes("<!-- friendly-adversary:")) {
        fail("FA_REPORT_CONTRACT_INVALID", `${name} must not contain Friendly Adversary control markers`);
    }
    if (Buffer.byteLength(normalized) > maximumBytes) {
        fail("FA_REPORT_TOO_LARGE", `${name} exceeds the ${maximumBytes}-byte limit`);
    }
    const secret = detectReportSecret(normalized);
    if (secret)
        fail("FA_SECRET_PATTERN_DETECTED", `${name} contains a recognizable ${secret} value`);
    return normalized;
}
async function requireSafeDirectory(directory, code) {
    const metadata = await lstat(directory).catch(() => fail(code, "required directory is missing"));
    if (metadata.isSymbolicLink() || !metadata.isDirectory())
        fail(code, "required directory is redirected or not a directory");
    return realpath(directory);
}
async function requireSingleRegularFile(filePath, code) {
    const metadata = await lstat(filePath).catch(() => fail(code, "required file is missing"));
    if (metadata.isSymbolicLink() || !metadata.isFile() || metadata.nlink !== 1) {
        fail(code, "required file is redirected, linked unexpectedly, or not regular");
    }
}
async function validateRun(plan, runDirectory) {
    await requireSafeDirectory(plan.repositoryRoot, "FA_REPOSITORY_INVALID");
    const runReal = await requireSafeDirectory(runDirectory, "FA_RUN_NOT_FOUND");
    if (path.basename(runReal) !== plan.runId) {
        fail("FA_PLAN_TAMPERED", "authorized run path does not match the immutable plan");
    }
    if (runReal !== plan.outputDirectory)
        fail("FA_PATH_OUTSIDE_RUN", "authorized run path differs from its private plan");
    await requireSingleRegularFile(path.join(runReal, RECEIPT_FILE), "FA_STATE_INVALID");
    const receipt = await readJson(path.join(runReal, RECEIPT_FILE)).catch(() => fail("FA_STATE_INVALID", "run state is malformed"));
    if (receipt.schemaVersion !== "1" || receipt.runId !== plan.runId || receipt.repositoryRoot !== plan.repositoryRoot
        || receipt.outputDirectory !== plan.outputDirectory
        || JSON.stringify([...receipt.expectedLenses].sort()) !== JSON.stringify(plan.expectedLenses))
        fail("FA_STATE_MISMATCH", "run state does not match the immutable plan");
    if (receipt.status !== "collected" && receipt.status !== "reviewing" && receipt.status !== "incomplete") {
        fail("FA_RUN_STATE", `publication is not allowed while run status is ${receipt.status}`);
    }
    return receipt;
}
async function publishNoReplace(target, content, runDirectory, signal) {
    const targetRelative = path.relative(runDirectory, target);
    if (path.isAbsolute(targetRelative) || targetRelative.startsWith("..")) {
        fail("FA_PATH_OUTSIDE_RUN", "publication artifact escapes the run namespace");
    }
    const existing = await readFile(target).catch((error) => {
        if (error.code === "ENOENT")
            return undefined;
        throw error;
    });
    if (existing) {
        if (existing.equals(Buffer.from(content)))
            return "confirmed_existing";
        fail("FA_REPORT_ALREADY_DIFFERENT", "artifact already contains a different committed publication");
    }
    const parent = await requireSafeDirectory(path.dirname(target), "FA_PUBLICATION_PARENT_CHANGED");
    if (parent !== path.dirname(target))
        fail("FA_PUBLICATION_PARENT_CHANGED", "artifact parent was redirected");
    const scratch = await requireSafeDirectory(`${runDirectory}.scratch`, "FA_PUBLICATION_SCRATCH_CHANGED");
    if (path.dirname(scratch) !== path.dirname(runDirectory))
        fail("FA_PATH_OUTSIDE_RUN", "publication scratch escaped the private run namespace");
    const candidate = path.join(scratch, `.publish-${randomBytes(16).toString("hex")}.tmp`);
    const handle = await open(candidate, "wx", 0o600);
    try {
        const bytes = Buffer.from(content);
        await handle.writeFile(bytes);
        await handle.sync();
    }
    finally {
        await handle.close();
    }
    try {
        throwIfCancelled(signal);
        await link(candidate, target);
    }
    catch (error) {
        if (error.code !== "EEXIST")
            throw error;
        const raced = await readFile(target);
        if (!raced.equals(Buffer.from(content)))
            fail("FA_REPORT_ALREADY_DIFFERENT", "artifact already contains a different committed publication");
        return "confirmed_existing";
    }
    finally {
        await unlink(candidate).catch(() => undefined);
    }
    return "created";
}
async function withAuthorizedRun(input, callback) {
    const authorized = await validateReviewAuthority({
        authorityId: input.authorityId,
        capability: input.writeCapability,
        scope: input.scope,
        ...(input.signal ? { signal: input.signal } : {}),
    });
    const receipt = await validateRun(authorized.plan, authorized.runDirectory);
    return callback({ plan: authorized.plan, runDirectory: authorized.runDirectory, receipt });
}
function lensEnvelope(plan, body) {
    return `- Model: ${plan.lensModel}\n- Effort: ${plan.lensEffort}\n- Host: ${plan.lensHost}\n\n${body}\n\n${LENS_COMPLETE}\n`;
}
function adjudicationEnvelope(plan, body, reportSha256) {
    return `- Model: ${plan.plannedModel}\n- Effort: ${plan.plannedEffort}\n- Host: ${plan.host}\n\n${body}\n\n<!-- ${OUTCOME_REPORT_SHA256}:${reportSha256} -->\n${DOCUMENT_COMPLETE}\n`;
}
function reportEnvelope(body) {
    return `${body}\n\n${DOCUMENT_COMPLETE}\n`;
}
export async function recordLensReport(input) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(input.lensId))
        fail("FA_LENS_INVALID", "lens_id is malformed");
    if (input.reportMarkdown === undefined) {
        fail("FA_REPORT_REQUIRED", "publish requires report_markdown");
    }
    const scope = { operation: "lens", lensId: input.lensId };
    return withAuthorizedRun({
        authorityId: input.authorityId,
        writeCapability: input.writeCapability,
        scope,
        ...(input.signal ? { signal: input.signal } : {}),
    }, async ({ plan, runDirectory }) => {
        if (!plan.expectedLenses.includes(input.lensId))
            fail("FA_LENS_NOT_EXPECTED", "lens is not selected for this run");
        const lensesRoot = await requireSafeDirectory(path.join(runDirectory, "lenses"), "FA_LENS_DIRECTORY_INVALID");
        if (path.dirname(lensesRoot) !== runDirectory)
            fail("FA_PATH_OUTSIDE_RUN", "lens directory escapes its run");
        const body = validateBody(input.reportMarkdown ?? "", "report_markdown", MAX_LENS_REPORT_BYTES);
        validateLensReportContract(body, `${input.lensId}.md`);
        const content = lensEnvelope(plan, body);
        if (Buffer.byteLength(content) > MAX_LENS_REPORT_BYTES)
            fail("FA_REPORT_TOO_LARGE", "lens report envelope exceeds the byte limit");
        const target = path.join(lensesRoot, `${input.lensId}.md`);
        const relativePath = `lenses/${input.lensId}.md`;
        throwIfCancelled(input.signal);
        const publication = await publishNoReplace(target, content, runDirectory, input.signal);
        return {
            ok: true,
            runId: plan.runId,
            operation: "publish",
            capabilityScope: `lens:${input.lensId}`,
            lensId: input.lensId,
            publication,
            relativePath,
            bytes: Buffer.byteLength(content),
            sha256: sha256(content),
            nextAction: "return_receipt_only",
        };
    });
}
export async function validateCommittedOutcome(runDirectory) {
    const runReal = await requireSafeDirectory(runDirectory, "FA_RUN_NOT_FOUND");
    for (const file of ["adjudication.md", "report.md"])
        await requireSingleRegularFile(path.join(runReal, file), "FA_OUTCOME_INCOMPLETE");
    const [adjudication, report] = await Promise.all([
        readFile(path.join(runReal, "adjudication.md"), "utf8"),
        readFile(path.join(runReal, "report.md"), "utf8"),
    ]);
    const binding = new RegExp(`<!-- ${OUTCOME_REPORT_SHA256}:([a-f0-9]{64}) -->`, "gu");
    const matches = [...adjudication.matchAll(binding)];
    if (matches.length !== 1 || matches[0][1] !== sha256(report)) {
        fail("FA_OUTCOME_PAIR_MISMATCH", "adjudication and report were not committed as one outcome");
    }
}
async function requireCompleteLenses(plan, runDirectory) {
    const lensesRoot = await requireSafeDirectory(path.join(runDirectory, "lenses"), "FA_LENS_DIRECTORY_INVALID");
    const actual = (await readdir(lensesRoot)).filter((file) => file.endsWith(".md")).sort();
    const expected = plan.expectedLenses.map((lens) => `${lens}.md`).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected))
        fail("FA_LENSES_INCOMPLETE", "not every selected lens has published exactly one report");
    for (const file of actual) {
        await requireSingleRegularFile(path.join(lensesRoot, file), "FA_LENS_REPORT_UNSAFE");
        const content = await readFile(path.join(lensesRoot, file), "utf8");
        if (!content.length)
            fail("FA_LENSES_INCOMPLETE", "not every selected lens has published exactly one report");
        if (!content.trimEnd().endsWith(LENS_COMPLETE))
            fail("FA_LENS_REPORT_INCOMPLETE", "a lens report lacks its completion marker");
        const metadata = `- Model: ${plan.lensModel}\n- Effort: ${plan.lensEffort}\n- Host: ${plan.lensHost}\n\n`;
        if (!content.startsWith(metadata))
            fail("FA_LENS_REPORT_INVALID", "a lens report has an invalid tool-owned metadata envelope");
        validatePersistedLensReportContract(content, file);
    }
}
export async function recordReviewOutcome(input) {
    if (input.adjudicationMarkdown === undefined || input.reportMarkdown === undefined) {
        fail("FA_OUTCOME_REQUIRED", "publish requires adjudication_markdown and report_markdown");
    }
    return withAuthorizedRun({
        authorityId: input.authorityId,
        writeCapability: input.writeCapability,
        scope: { operation: "outcome" },
        ...(input.signal ? { signal: input.signal } : {}),
    }, async ({ plan, runDirectory }) => {
        await requireCompleteLenses(plan, runDirectory);
        const adjudicationBody = validateBody(input.adjudicationMarkdown ?? "", "adjudication_markdown", MAX_OUTCOME_DOCUMENT_BYTES);
        const reportBody = validateBody(input.reportMarkdown ?? "", "report_markdown", MAX_OUTCOME_DOCUMENT_BYTES, [INCOMPLETE_STATUS]);
        if (/^- (?:Model|Effort|Host):/mu.test(adjudicationBody)) {
            fail("FA_REPORT_CONTRACT_INVALID", "adjudication body must not repeat tool-owned model metadata");
        }
        const report = reportEnvelope(reportBody);
        const adjudication = adjudicationEnvelope(plan, adjudicationBody, sha256(report));
        const artifacts = [
            { kind: "adjudication", relativePath: "adjudication.md", bytes: Buffer.byteLength(adjudication), sha256: sha256(adjudication) },
            { kind: "report", relativePath: "report.md", bytes: Buffer.byteLength(report), sha256: sha256(report) },
        ];
        throwIfCancelled(input.signal);
        const adjudicationPublication = await publishNoReplace(path.join(runDirectory, "adjudication.md"), adjudication, runDirectory, input.signal);
        const reportPublication = await publishNoReplace(path.join(runDirectory, "report.md"), report, runDirectory);
        const recovered = [adjudicationPublication, reportPublication].some((value) => value !== "created");
        return {
            ok: true,
            runId: plan.runId,
            operation: "publish",
            capabilityScope: "outcome",
            artifacts,
            publication: recovered ? "confirmed_existing" : "created",
            nextAction: "seal_and_verify",
        };
    });
}
//# sourceMappingURL=lens-report.js.map