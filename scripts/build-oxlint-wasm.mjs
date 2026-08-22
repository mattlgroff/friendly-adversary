import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE = "rust@sha256:14bc9c5966e7b3a385794b3d5389a8765668342025fbcc7b2e3d2866ac4bd8c3";
const EXPECTED_SHA256 = "8893c7e1a230eea648ca646a578afbd62c1712f9f8d36a4ab2e8589c73b6a5bb";
const OUTPUT_NAME = "friendly_adversary_oxlint_wasm.wasm";
const ARTIFACT = path.join(ROOT, "wasm", "oxlint", "engine.wasm");
const temporary = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-oxlint-build-"));

function digest(data) {
  return createHash("sha256").update(data).digest("hex");
}

function runDocker() {
  const command = [
    "run",
    "--rm",
    "--platform",
    "linux/arm64",
    "--mount",
    `type=bind,source=${ROOT},target=/work,readonly`,
    "--mount",
    `type=bind,source=${temporary},target=/output`,
    "--workdir",
    "/work",
    IMAGE,
    "sh",
    "-c",
    [
      "rustup target add wasm32-wasip1",
      "CARGO_TARGET_DIR=/output/target RUSTFLAGS='-C link-arg=--initial-memory=33554432 -C link-arg=--max-memory=4294967296 -C link-arg=--export-memory' cargo build --manifest-path build/oxlint-wasm/Cargo.toml --target wasm32-wasip1 --release --locked",
      `cp /output/target/wasm32-wasip1/release/${OUTPUT_NAME} /output/engine.wasm`,
    ].join(" && "),
  ];
  execFileSync("docker", command, { cwd: ROOT, stdio: "inherit" });
}

try {
  if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== "--check")) {
    throw new Error("Usage: node scripts/build-oxlint-wasm.mjs [--check]");
  }
  runDocker();
  const built = await readFile(path.join(temporary, "engine.wasm"));
  const builtDigest = digest(built);
  if (builtDigest !== EXPECTED_SHA256) {
    throw new Error(`Rebuilt Oxlint WebAssembly digest ${builtDigest} did not match ${EXPECTED_SHA256}`);
  }
  if (process.argv[2] === "--check") {
    const shippedDigest = digest(await readFile(ARTIFACT));
    if (shippedDigest !== builtDigest) {
      throw new Error(`Shipped Oxlint WebAssembly digest ${shippedDigest} did not match rebuilt ${builtDigest}`);
    }
    process.stdout.write(`Reproduced Oxlint WebAssembly artifact ${builtDigest}\n`);
  } else {
    await copyFile(path.join(temporary, "engine.wasm"), ARTIFACT);
    process.stdout.write(`Built Oxlint WebAssembly artifact ${builtDigest}\n`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
