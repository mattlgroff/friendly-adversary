import { chmod, copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function installLocalNodeBin(
  repo: string,
  name: string,
  source: string,
): Promise<string> {
  const packageName = `friendly-adversary-fixture-${name}`;
  const packageDirectory = path.join(repo, "node_modules", packageName);
  const binDirectory = path.join(repo, "node_modules", ".bin");
  const cli = path.join(packageDirectory, "cli.mjs");
  await mkdir(packageDirectory, { recursive: true });
  await mkdir(binDirectory, { recursive: true });
  await writeFile(
    path.join(packageDirectory, "package.json"),
    `${JSON.stringify({ name: packageName, version: "1.0.0", private: true, type: "module", bin: { [name]: "cli.mjs" } })}\n`,
  );
  await writeFile(cli, `#!/usr/bin/env node\n${source}\n`);
  if (process.platform === "win32") {
    await writeFile(
      path.join(binDirectory, `${name}.cmd`),
      `@ECHO off\r\n"${process.execPath}" "%~dp0\\..\\${packageName}\\cli.mjs" %*\r\n`,
    );
  } else {
    const launcher = path.join(binDirectory, name);
    await writeFile(launcher, `#!/usr/bin/env node\n${source}\n`);
    await chmod(launcher, 0o755);
  }
  return cli;
}

export async function installGlobalNodeFixture(
  directory: string,
  repo: string,
  name: string,
  command: string,
  source: string,
  workingDirectories: string[] = [repo],
): Promise<string> {
  await mkdir(directory, { recursive: true });
  const executable = path.join(directory, process.platform === "win32" ? `${name}.exe` : name);
  if (process.platform === "win32") {
    await copyFile(process.execPath, executable);
    for (const workingDirectory of workingDirectories) {
      await writeFile(path.join(workingDirectory, command), source);
    }
  } else {
    await writeFile(executable, `#!/usr/bin/env node\nif (process.argv[2] === "--version") { console.log("${name} fixture 1.0"); process.exit(0); }\n${source}\n`);
    await chmod(executable, 0o755);
  }
  return executable;
}
