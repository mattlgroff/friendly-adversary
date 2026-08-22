const { exec: invoke, execSync } = require("node:child_process");
const processRunner = require("child_process");
const command = process.argv[2];

invoke(command);
execSync(command);
processRunner.exec(command);

const { exec: localExec } = require("./local-tools");
localExec(command);
