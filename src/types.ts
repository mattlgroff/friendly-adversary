export type RunStatus = "prepared" | "collected" | "reviewing" | "incomplete" | "sealed" | "sealed-incomplete";

export interface ReviewOptions {
  timeoutMs: number;
}

export interface GitSnapshot {
  baseRef: string;
  baseSha: string;
  headSha: string;
  mergeBaseSha: string;
  diffHash: string;
  dirty: boolean;
}

export interface ToolRunRecord {
  name: string;
  status: "completed" | "skipped" | "execution-error" | "timed-out";
  command?: string;
  exitCode?: number;
  signal?: string;
  durationMs?: number;
  artifactDirectory: string;
  reason?: string;
  required?: boolean;
}

export interface ModelMetadata {
  model: string;
  effort: string;
  host: string;
}

export interface ReviewReceipt {
  schemaVersion: "1";
  productVersion: string;
  runId: string;
  createdAt: string;
  updatedAt: string;
  status: RunStatus;
  repositoryRoot: string;
  outputDirectory: string;
  publicationDirectory?: string;
  git: GitSnapshot;
  options: ReviewOptions;
  changedFiles: string[];
  changedFileCount: number;
  selectedLanguages: Array<"typescript" | "python">;
  expectedLenses: string[];
  lensDefinitions: Array<{ id: string; version: string; sha256: string }>;
  modelMetadata?: {
    adjudicator: ModelMetadata;
    lenses: Array<ModelMetadata & { id: string }>;
  };
  toolRuns: ToolRunRecord[];
  incompleteReasons: string[];
  sealedAt?: string;
  artifactCount?: number;
}

export interface CommandSpec {
  name: string;
  executable: string;
  args: string[];
  cwd: string;
  artifactDirectory: string;
  stdoutExtension?: "txt" | "json" | "sarif";
  versionArgs?: string[];
  timeoutMs: number;
  env?: NodeJS.ProcessEnv;
}

export interface CommandResult {
  exitCode: number;
  signal?: string;
  durationMs: number;
  timedOut: boolean;
  outputLimitExceeded: boolean;
  spawnError?: string;
  versionFailure?: string;
  commandDisplay: string;
}

export interface PrepareOptions {
  repo: string;
  base?: string;
  outputRoot?: string;
  timeoutMs: number;
  expectedLenses: string[];
  host?: "claude-code" | "codex" | "unavailable";
}
