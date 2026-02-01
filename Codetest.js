#!/usr/bin/env node
import { spawn } from "child_process";
import chokidar from "chokidar";
import { join, dirname, isAbsolute } from "path";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import chalk from "chalk";
import { execFileSync } from "node:child_process";
import { Setup } from "./lib/Commands.js";
import { judges } from "./lib/judges/JudgeRegistry.js";
import { config } from "./lib/judges/Config.js";
import { SubmitCode } from "./lib/SubmitCode.js";

if (process.argv.length <= 2 || process.argv.indexOf("--help") !== -1) {
  console.log("HELP");
  console.log("[file] [parameters] [options]");
  console.log("file: path to a valid testgen file.");
  console.log("parameters: VAR=VALUE or VAR=<RANGE_START>..<RANGE_END>");
  console.log("options: --verbose;--keep-input;--watch");
  process.exit(0);
}
let args = process.argv.slice(2);
let watchMode = false;
if (args[0] === "--auth") {
  const judgeName = args[1];
  if (!judgeName) {
    console.log("Available judges:", judges.list().join(", "));
    process.exit(0);
  }

  const judge = judges.get(judgeName);
  if (!judge) {
    console.error(`Unknown judge: ${judgeName}`);
    process.exit(1);
  }

  if (judge.isUsingBearerToken()) {
    const token = args[2];
    if (!token) {
      console.error(`Usage: codetest --auth ${judge.name} <bearer-token>`);
      process.exit(1);
    }
    config.setJudgeCredentials(judge.name, { token });
    console.log(` ${judge.name} credentials saved`);
  } else if (judge.name === "Pesho") {
    const [username, password] = args.slice(2);
    if (!username || !password) {
      console.error("Usage: codetest --auth pesho <username> <password>");
      process.exit(1);
    }
    config.setJudgeCredentials("pesho", { username, password });
    console.log("✅ Pesho credentials saved");
  } else if (judge.isAutomatedAuth()) {
    const cred = await judge.authenticateInteractive();
    config.setJudgeCredentials(judge.name, cred);
    console.log(` ${judge.name} credentials saved`);
  }
  process.exit(0);
}else if (args[0] === '--submit' || args[0] === '-s') {
  const file = args[1];
  if (!file) {
    console.error('No file specified and no last file found');
    process.exit(1);
  }
  await SubmitCode(file);
  process.exit(0);
}
const watchModeIndex = args.indexOf("--watch");
if (watchModeIndex !== -1) {
  args.splice(watchModeIndex, 1);
  watchMode = true;
}
let testScriptPath = args[0];
args = args.slice(1);
let testScriptDir = dirname(testScriptPath);

if (!fs.existsSync(testScriptPath)) {
  const stdTestFile = join(
    import.meta.dirname,
    "stdTest",
    testScriptPath + ".js",
  );
  if (fs.existsSync(stdTestFile)) {
    testScriptPath = stdTestFile;
    testScriptDir = process.cwd();
  } else {
    console.error(`Test script ${testScriptPath} does not exist.`);
    process.exit(1);
  }
}

const configFromScript = {
  cppFiles: [],
  CFG: {},
  ...getConfigFromScript(),
};
let childProcess;
// Always run the first time
const exitCode = await runTest();

if (watchMode || configFromScript.CFG.watch) {
  Setup(testScriptPath, args, configFromScript);
  const watchFiles = [testScriptPath, ...configFromScript.cppFiles];

  console.log(`>>> Watching for file changes to re-run ${watchFiles}...`);
  chokidar.watch(watchFiles).on("change", (file) => {
    console.log(`>>> ${file} changed. Re-running...`);
    runTest();
  });
} else {
  process.exit(exitCode);
}

async function runTest() {
  try {
    if (childProcess && childProcess.exitCode === null) {
      console.log(`Killing ${childProcess.pid}`);
      childProcess.kill();
      await waitForProcess(childProcess);
    }
    console.log(
      `>>> ${chalk.cyan("Running")} ${testScriptPath} ${args.join(" ")}`,
    );
    childProcess = spawn(
      process.execPath,
      [
        "--import",
        pathToFileURL(join(import.meta.dirname, "lib", "loader.js")),
        testScriptPath,
        ...args,
      ],
      { stdio: "inherit" },
    );
    const { code } = await waitForProcess(childProcess);
    console.log(
      `>>> ${testScriptPath} exited with code ${code == 0 ? chalk.green(code) : chalk.red(code)}`,
    );
    return code;
  } catch (e) {
    console.error("Error running test:");
    console.error(e);
    process.exit(e.status || 1);
  }
}

async function waitForProcess(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve({ code: child.exitCode, signal: null });
      return;
    }
    child.on("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });
}

function getConfigFromScript() {
  try {
    const stdout = execFileSync(process.execPath, [
      "--import",
      pathToFileURL(join(import.meta.dirname, "lib", "cpp-deps-loader.js")),
      testScriptPath,
      ...args,
    ]);
    try {
      return JSON.parse(stdout);
    } catch (e) {
      console.error("Failed to get CPP files!");
      console.error("---stdout---");
      console.error(stdout.toString());
    }
  } catch (e) {
    console.error("Failed to get CPP files!1");
    console.error("---stdout---");
    console.error(e.output?.[1]?.toString());
    console.error("---stderr---");
    console.error(e.output?.[2]?.toString());
  }
  process.exit(1);
}
