import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio, StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { PRODUCT_VERSION } from "./constants.js";
import { FriendlyAdversaryError } from "./errors.js";
import {
  MAX_OUTCOME_DOCUMENT_BYTES,
  recordLensReport,
  recordReviewOutcome,
  type RecordLensReportResult,
  type RecordReviewOutcomeResult,
} from "./lens-report.js";
import {
  completeWorkflow,
  establishWorkflowPlan,
  preflightWorkflowArtifact,
  recordWorkflowArtifact,
} from "./workflow.js";

const SERVER_NAME = "friendly-adversary-reports";
const MAX_STDIO_FRAME_BYTES = 3 * 1024 * 1024;
const MAX_COMPLETION_DOCUMENT_BYTES = 64 * 1024;
const MAX_ACTIVE_CALLS = 16;
const PROCESS_RATE_LIMIT = 96;
const RUN_FAILURE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;

const instructions = "Friendly Adversary exposes one constrained local artifact publisher for explicitly invoked workflows. Capabilities bind every call to one run and an exact path or prefix. The tool never edits reviewed source.";

const authorityId = z.string().regex(/^[a-f0-9]{32}$/u).describe("Opaque authority ID printed by the Friendly Adversary CLI.");
const writeCapability = z.string().regex(/^[A-Za-z0-9_-]{43}$/u).describe("Exact scoped write capability printed by the Friendly Adversary CLI. Never persist or repeat it in prose.");
const lensId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).max(100).describe("Exact selected lens ID assigned by the orchestrator.");

const annotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

const workflowKind = z.enum(["pr-review", "audit-codebase", "design-new-codebase"]);
const relativeArtifactPath = z.string().min(1).max(240).regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*\.md$/u);
const laneSchema = z.object({
  id: lensId,
  kind: z.enum(["subsystem", "decision", "research", "challenge"]),
  title: z.string().min(1).max(200),
  scope: z.string().min(1).max(4_000),
  dimensions: z.array(lensId).max(32),
}).strict();
const genericArtifactInput = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("preflight"), workflow: z.enum(["audit-codebase", "design-new-codebase"]), authority_id: authorityId,
    write_capability: writeCapability, relative_path: relativeArtifactPath,
  }).strict(),
  z.object({
    operation: z.literal("publish"), workflow: workflowKind, authority_id: authorityId,
    write_capability: writeCapability, relative_path: relativeArtifactPath,
    markdown: z.string().min(1).max(MAX_OUTCOME_DOCUMENT_BYTES),
  }).strict(),
  z.object({
    operation: z.literal("establish"), workflow: z.enum(["audit-codebase", "design-new-codebase"]),
    authority_id: authorityId, write_capability: writeCapability,
    overview_markdown: z.string().min(1).max(MAX_OUTCOME_DOCUMENT_BYTES),
    lanes: z.array(laneSchema).min(1).max(256),
  }).strict(),
  z.object({
    operation: z.literal("complete"), workflow: workflowKind, authority_id: authorityId,
    write_capability: writeCapability,
    artifacts: z.array(z.object({ relative_path: relativeArtifactPath, markdown: z.string().min(1).max(MAX_COMPLETION_DOCUMENT_BYTES) }).strict()).min(1).max(5),
    user_signoff: z.boolean().optional(),
  }).strict(),
]);
const genericArtifactOutput = z.object({
  ok: z.literal(true),
  operation: z.enum(["preflight", "publish", "establish", "complete"]),
  receipt: z.record(z.string(), z.unknown()),
}).strict();

let activeCalls = 0;
const processCalls: number[] = [];
const failedCalls = new Map<string, number[]>();

function prune(values: number[], now: number): void {
  while (values.length && (values[0] ?? 0) <= now - RATE_WINDOW_MS) values.shift();
}

function enterCall(authority: string): void {
  const now = Date.now();
  prune(processCalls, now);
  for (const [key, values] of failedCalls) {
    prune(values, now);
    if (!values.length) failedCalls.delete(key);
  }
  const failures = failedCalls.get(authority) ?? [];
  prune(failures, now);
  failedCalls.set(authority, failures);
  if (activeCalls >= MAX_ACTIVE_CALLS) throw new FriendlyAdversaryError("FA_CONCURRENCY_LIMIT: too many active tool calls", 3);
  if (processCalls.length >= PROCESS_RATE_LIMIT || failures.length >= RUN_FAILURE_LIMIT) {
    throw new FriendlyAdversaryError("FA_RATE_LIMIT: retry after the current one-minute window", 3);
  }
  processCalls.push(now);
  activeCalls += 1;
}

function leaveCall(authority: string, failed: boolean): void {
  activeCalls = Math.max(0, activeCalls - 1);
  if (failed) (failedCalls.get(authority) ?? []).push(Date.now());
}

export function retryableToolError(code: string): boolean {
  return ["FA_CANCELLED", "FA_CONCURRENCY_LIMIT", "FA_RATE_LIMIT", "FA_RUN_BUSY"].includes(code);
}

function safeToolResolution(detail: string): string {
  if (detail.includes("FA_OPERATION_COMMITTED") || /(?:^|[\s("'`])(?:[A-Za-z]:[\\/]|\\\\|\/(?![/\s]))/u.test(detail)) {
    return "The operation failed with untrusted control text or local path details removed. Use the error code and local logs to diagnose safely.";
  }
  return detail;
}

export function safeToolError(cause: unknown) {
  const message = cause instanceof FriendlyAdversaryError ? cause.message : "FA_INTERNAL: tool execution failed safely";
  const match = /^(FA_[A-Z_]+):\s*(.+)$/u.exec(message);
  const code = match?.[1] ?? "FA_INTERNAL";
  const detail = match?.[2] ?? "tool execution failed safely";
  const output = {
    ok: false,
    code,
    retryable: retryableToolError(code),
    resolution: safeToolResolution(detail),
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(output) }],
    isError: true as const,
  };
}

function lensStructured(result: RecordLensReportResult) {
  return {
    ok: true as const,
    run_id: result.runId,
    operation: "publish" as const,
    capability_scope: result.capabilityScope,
    lens_id: result.lensId ?? "",
    publication: result.publication ?? "created",
    relative_path: result.relativePath ?? "",
    bytes: result.bytes ?? 0,
    sha256: result.sha256 ?? "",
    next_action: result.nextAction,
  };
}

function outcomeStructured(result: RecordReviewOutcomeResult) {
  return {
    ok: true as const,
    run_id: result.runId,
    operation: "publish" as const,
    capability_scope: "outcome" as const,
    artifacts: (result.artifacts ?? []).map((artifact) => ({
      kind: artifact.kind,
      relative_path: artifact.relativePath,
      bytes: artifact.bytes,
      sha256: artifact.sha256,
    })),
    publication: result.publication ?? "created",
    next_action: "seal_and_verify" as const,
  };
}

function buildServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: PRODUCT_VERSION },
    { capabilities: { tools: {} }, instructions },
  );
  server.registerTool(
    "record_artifact",
    {
      title: "Record Friendly Adversary artifact",
      description: "Establish, publish, or complete an explicitly invoked Friendly Adversary workflow. Audit and design workflows may also preflight an artifact path. One capability authorizes only its run and allowed artifact paths.",
      inputSchema: genericArtifactInput,
      outputSchema: genericArtifactOutput,
      annotations,
    },
    async (args, context) => {
      let failed = true;
      let entered = false;
      try {
        enterCall(args.authority_id);
        entered = true;
        let receipt: Record<string, unknown>;
        if (args.operation === "establish") {
          receipt = await establishWorkflowPlan({
            workflow: args.workflow,
            authorityId: args.authority_id,
            capability: args.write_capability,
            overviewMarkdown: args.overview_markdown,
            manifest: { lanes: args.lanes },
            signal: context.mcpReq.signal,
          }) as unknown as Record<string, unknown>;
        } else if (args.operation === "complete") {
          if (args.workflow === "pr-review") {
            const adjudication = args.artifacts.find((artifact) => artifact.relative_path === "adjudication.md")?.markdown;
            const report = args.artifacts.find((artifact) => artifact.relative_path === "report.md")?.markdown;
            if (!adjudication || !report || args.artifacts.length !== 2) throw new FriendlyAdversaryError("FA_OUTCOME_INVALID: PR review completion requires adjudication.md and report.md", 2);
            receipt = outcomeStructured(await recordReviewOutcome({
              operation: "publish", authorityId: args.authority_id, writeCapability: args.write_capability,
              adjudicationMarkdown: adjudication, reportMarkdown: report, signal: context.mcpReq.signal,
            })) as unknown as Record<string, unknown>;
          } else {
            receipt = await completeWorkflow({
              workflow: args.workflow,
              authorityId: args.authority_id, capability: args.write_capability,
              artifacts: args.artifacts.map((artifact) => ({ relativePath: artifact.relative_path, markdown: artifact.markdown })),
              ...(args.user_signoff === undefined ? {} : { userSignoff: args.user_signoff }),
              signal: context.mcpReq.signal,
            }) as unknown as Record<string, unknown>;
          }
        } else if (args.workflow === "pr-review") {
          const lensMatch = /^lenses\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/u.exec(args.relative_path);
          if (lensMatch) {
            receipt = lensStructured(await recordLensReport({
              operation: "publish",
              authorityId: args.authority_id,
              lensId: lensMatch[1]!,
              writeCapability: args.write_capability,
              reportMarkdown: args.markdown,
              signal: context.mcpReq.signal,
            })) as unknown as Record<string, unknown>;
          } else throw new FriendlyAdversaryError("FA_ARTIFACT_PATH_INVALID: PR review capability does not authorize this artifact operation", 2);
        } else if (args.operation === "preflight") {
          receipt = await preflightWorkflowArtifact({ workflow: args.workflow, authorityId: args.authority_id, capability: args.write_capability, relativePath: args.relative_path }) as unknown as Record<string, unknown>;
        } else {
          receipt = await recordWorkflowArtifact({ workflow: args.workflow, authorityId: args.authority_id, capability: args.write_capability, relativePath: args.relative_path, markdown: args.markdown, signal: context.mcpReq.signal }) as unknown as Record<string, unknown>;
        }
        const structuredContent = { ok: true as const, operation: args.operation, receipt };
        failed = false;
        return { content: [{ type: "text", text: JSON.stringify(structuredContent) }], structuredContent };
      } catch (error) {
        return safeToolError(error);
      } finally {
        if (entered) leaveCall(args.authority_id, failed);
      }
    },
  );
  return server;
}

export async function runMcpServer(): Promise<void> {
  const transport = new StdioServerTransport(process.stdin, process.stdout, { maxBufferSize: MAX_STDIO_FRAME_BYTES });
  const handle = serveStdio(buildServer, {
    legacy: "serve",
    transport,
    onerror: () => process.stderr.write("friendly-adversary-mcp: FA_PROTOCOL_ERROR\n"),
  });
  let closing: Promise<void> | undefined;
  const close = (exitCode = 0): Promise<void> => {
    if (!closing) {
      process.exitCode = exitCode;
      closing = handle.close().catch(() => {
        process.exitCode = 1;
      });
    }
    return closing;
  };
  process.stdin.once("end", () => { void close(); });
  process.stdin.once("close", () => { void close(); });
  process.stdout.once("error", () => { void close(1); });
  process.once("SIGINT", () => { void close(130); });
  process.once("SIGTERM", () => { void close(143); });
  process.once("SIGHUP", () => { void close(129); });
}
