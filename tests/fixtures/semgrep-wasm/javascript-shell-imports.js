import { exec } from "node:child_process";
import { execSync as runSync } from "child_process";
import * as processTools from "node:child_process";
import { exec as localExec } from "./local-tools.js";

const command = process.argv[2];
exec(command);
runSync(command);
processTools.exec(command);
localExec(command);

function execLocal(value) {
  return value;
}

execLocal(command);
