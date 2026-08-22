const childProcess = require("node:child_process");
const input = process.argv[2];
eval(input);
childProcess.exec(input);
eval("literal is intentionally excluded");
