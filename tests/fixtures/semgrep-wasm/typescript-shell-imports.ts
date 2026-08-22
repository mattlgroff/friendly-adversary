import { exec as runCommand, execSync } from "node:child_process";

const command: string = process.argv[2] ?? "";
runCommand(command);
execSync(command);

const localRunner = (value: string): string => value;
localRunner(command);
