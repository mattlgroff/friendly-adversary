import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { runCaptured } from "../src/command.js";

test("command capture preserves native stdout and stderr bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-command-"));
  try {
    const stdout = Buffer.from([0x61, 0x00, 0x62, 0xff]);
    const stderr = Buffer.from([0x65, 0x72, 0x72, 0x00]);
    const script = `process.stdout.write(Buffer.from('${stdout.toString("base64")}', 'base64'));process.stderr.write(Buffer.from('${stderr.toString("base64")}', 'base64'))`;
    const result = await runCaptured({ name: "fixture", executable: process.execPath, args: ["-e", script], cwd: root, artifactDirectory: root, timeoutMs: 10_000 });
    assert.equal(result.exitCode, 0);
    assert.deepEqual(await readFile(path.join(root, "stdout.txt")), stdout);
    assert.deepEqual(await readFile(path.join(root, "stderr.txt")), stderr);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("command capture rejects a redirected evidence directory before publishing output", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-command-evidence-"));
  const artifacts = path.join(root, "artifacts");
  const outside = path.join(root, "outside");
  try {
    await mkdir(artifacts);
    await mkdir(outside);
    const script = [
      "const fs=require('node:fs')",
      `fs.rmSync(${JSON.stringify(artifacts)},{recursive:true,force:true})`,
      `fs.symlinkSync(${JSON.stringify(outside)},${JSON.stringify(artifacts)},${process.platform === "win32" ? JSON.stringify("junction") : JSON.stringify("dir")})`,
      "process.stdout.write('must not publish')",
    ].join(";");
    await assert.rejects(
      runCaptured({
        name: "redirect",
        executable: process.execPath,
        args: ["-e", script],
        cwd: root,
        artifactDirectory: artifacts,
        timeoutMs: 10_000,
      }),
      /FA_EVIDENCE_DIRECTORY_UNSAFE/u,
    );
    assert.deepEqual(await readdir(outside), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("command timeout terminates the process and preserves partial output", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-timeout-"));
  try {
    const grandchildPid = path.join(root, "grandchild.pid");
    const started = Date.now();
    const result = await runCaptured({
      name: "timeout",
      executable: process.execPath,
      args: ["-e", `const{spawn}=require('node:child_process');const{writeFileSync}=require('node:fs');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});writeFileSync(${JSON.stringify(grandchildPid)},String(child.pid));process.stdout.write('started');setInterval(() => {}, 1000)`],
      cwd: root,
      artifactDirectory: root,
      timeoutMs: 1_000,
    });
    assert.equal(result.timedOut, true);
    assert.ok(Date.now() - started < 5_000);
    assert.equal(await readFile(path.join(root, "stdout.txt"), "utf8"), "started");
    const pid = Number(await readFile(grandchildPid, "utf8"));
    assert.throws(() => process.kill(pid, 0), /ESRCH/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("command execution preserves argv boundaries and strips ambient secrets", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-argv-"));
  const previous = process.env.FRIENDLY_ADVERSARY_TEST_SECRET;
  const ambientSecret = `must-not-leak-${process.pid}`;
  process.env.FRIENDLY_ADVERSARY_TEST_SECRET = ambientSecret;
  try {
    const values = ["space value", "semi;colon", "$HOME", "quote'and\"double", "line\nbreak"];
    const result = await runCaptured({
      name: "argv",
      executable: process.execPath,
      args: ["-e", "process.stdout.write(JSON.stringify({argv:process.argv.slice(1),secret:process.env.FRIENDLY_ADVERSARY_TEST_SECRET,homes:[process.env.HOME,process.env.USERPROFILE,process.env.APPDATA,process.env.LOCALAPPDATA].filter(Boolean)}))", ...values],
      cwd: root,
      artifactDirectory: root,
      timeoutMs: 10_000,
    });
    assert.equal(result.exitCode, 0);
    const stdout = await readFile(path.join(root, "stdout.txt"), "utf8");
    const stderr = await readFile(path.join(root, "stderr.txt"), "utf8");
    assert.equal(stdout.includes(ambientSecret), false);
    assert.equal(stderr.includes(ambientSecret), false);
    const captured = JSON.parse(stdout) as { argv: string[]; homes: string[]; secret?: string };
    assert.deepEqual(captured.argv, values);
    assert.equal(captured.secret, undefined);
    assert.ok(captured.homes.length >= 1);
    assert.equal(new Set(captured.homes).size, 1);
    assert.notEqual(captured.homes[0], process.env.USERPROFILE);
  } finally {
    if (previous === undefined) delete process.env.FRIENDLY_ADVERSARY_TEST_SECRET;
    else process.env.FRIENDLY_ADVERSARY_TEST_SECRET = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("output stream failures reject through the collection boundary", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-stream-error-"));
  try {
    await writeFile(path.join(root, "stdout.txt"), "already exists\n");
    await assert.rejects(() => runCaptured({
      name: "stream-error",
      executable: process.execPath,
      args: ["-e", "process.stdout.write('new output')"],
      cwd: root,
      artifactDirectory: root,
      timeoutMs: 10_000,
    }), /EEXIST/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("version probes preserve separate native streams and execution metadata", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-version-"));
  try {
    const stdout = Buffer.from([0x76, 0x00, 0xff]);
    const stderr = Buffer.from([0x65, 0x0d, 0x0a]);
    const versionScript = `process.stdout.write(Buffer.from('${stdout.toString("base64")}', 'base64'));process.stderr.write(Buffer.from('${stderr.toString("base64")}', 'base64'));process.exit(7)`;
    const result = await runCaptured({
      name: "version",
      executable: process.execPath,
      args: ["-e", ""],
      versionArgs: ["-e", versionScript],
      cwd: root,
      artifactDirectory: root,
      timeoutMs: 10_000,
    });
    assert.deepEqual(await readFile(path.join(root, "version-stdout.txt")), stdout);
    assert.deepEqual(await readFile(path.join(root, "version-stderr.txt")), stderr);
    assert.equal(await readFile(path.join(root, "version-exit-code.txt"), "utf8"), "7\n");
    assert.equal(result.versionFailure, "Version probe exited with code 7");
    const metadata = JSON.parse(await readFile(path.join(root, "version-metadata.json"), "utf8")) as { durationMs: number; timedOut: boolean };
    assert.ok(metadata.durationMs >= 0);
    assert.equal(metadata.timedOut, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("termination signals stop the detached analyzer before the collector exits", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-signal-"));
  try {
    const pidFile = path.join(root, "analyzer.pid");
    const artifacts = path.join(root, "artifacts");
    const afterMarker = path.join(root, "caller-continued");
    const commandModule = pathToFileURL(path.resolve("dist", "src", "command.js")).href;
    const analyzer = `require('node:fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));setInterval(() => {}, 1000)`;
    const runner = `import { writeFileSync } from 'node:fs';import { runCaptured } from ${JSON.stringify(commandModule)};process.on('message',()=>{process.emit('SIGTERM','SIGTERM');process.disconnect?.();});try{await runCaptured({name:'signal',executable:process.execPath,args:['-e',${JSON.stringify(analyzer)}],cwd:${JSON.stringify(root)},artifactDirectory:${JSON.stringify(artifacts)},timeoutMs:60000});writeFileSync(${JSON.stringify(afterMarker)},'yes');}catch(error){process.exitCode=error?.exitCode??process.exitCode??1;}`;
    const collector = spawn(process.execPath, ["--input-type=module", "-e", runner], { stdio: process.platform === "win32" ? ["ignore", "ignore", "ignore", "ipc"] : "ignore" });
    let analyzerPid = 0;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      try {
        analyzerPid = Number(await readFile(pidFile, "utf8"));
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    assert.ok(analyzerPid > 0, "analyzer did not start");
    if (process.platform === "win32") collector.send("SIGTERM");
    else collector.kill("SIGTERM");
    const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
      collector.once("close", (code, signal) => resolve({ code, signal }));
    });
    assert.equal(exit.signal, null);
    assert.equal(exit.code, 143);
    assert.throws(() => process.kill(analyzerPid, 0), /ESRCH/);
    await assert.rejects(() => readFile(afterMarker), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a signal during version capture does not launch the analyzer", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-version-signal-"));
  try {
    const versionPidFile = path.join(root, "version.pid");
    const analyzerMarker = path.join(root, "analyzer-ran");
    const artifacts = path.join(root, "artifacts");
    const commandModule = pathToFileURL(path.resolve("dist", "src", "command.js")).href;
    const version = `require('node:fs').writeFileSync(${JSON.stringify(versionPidFile)}, String(process.pid));setInterval(() => {}, 1000)`;
    const analyzer = `require('node:fs').writeFileSync(${JSON.stringify(analyzerMarker)}, 'yes')`;
    const runner = `import { runCaptured } from ${JSON.stringify(commandModule)};process.on('message',()=>{process.emit('SIGTERM','SIGTERM');process.disconnect?.();});try{await runCaptured({name:'signal-version',executable:process.execPath,args:['-e',${JSON.stringify(analyzer)}],versionArgs:['-e',${JSON.stringify(version)}],cwd:${JSON.stringify(root)},artifactDirectory:${JSON.stringify(artifacts)},timeoutMs:60000});}catch(error){process.exitCode=error?.exitCode??process.exitCode??1;}`;
    const collector = spawn(process.execPath, ["--input-type=module", "-e", runner], { stdio: process.platform === "win32" ? ["ignore", "ignore", "ignore", "ipc"] : "ignore" });
    for (let attempt = 0; attempt < 200; attempt += 1) {
      try {
        await readFile(versionPidFile, "utf8");
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    assert.ok((await readFile(versionPidFile, "utf8")).length > 0, "version probe did not start");
    if (process.platform === "win32") collector.send("SIGTERM");
    else collector.kill("SIGTERM");
    const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
      collector.once("close", (code, signal) => resolve({ code, signal }));
    });
    assert.equal(exit.signal, null);
    assert.equal(exit.code, 143);
    await assert.rejects(() => readFile(analyzerMarker), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
