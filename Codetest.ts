#!/usr/bin/env node
import { spawn, ChildProcess } from "child_process";
import chokidar from "chokidar";
import { join, dirname } from "path";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import chalk from "chalk";
import { execFileSync } from "node:child_process";
import { Setup } from "./utils/Commands.ts";
import { judges } from "./lib/judges/JudgeRegistry.ts";
import { config } from "./lib/judges/Config.ts";
import { SubmitCode } from "./lib/SubmitCode.ts";
import { CommitCppWithDir } from "./utils/CommitDirs.ts";
import copyTypes from "./utils/CopyTypes.ts";
import copyDevJS from "./utils/CopyDevJS.ts";

interface TestScriptConfig {
  cppFiles: string[];
  CFG: Record<string, unknown>;
  [key: string]: unknown;
}

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
    const cred = await judge.authenticateInteractive!();
    config.setJudgeCredentials(judge.name, cred);
    console.log(` ${judge.name} credentials saved`);
  }
  process.exit(0);
} else if (args[0] === "--submit" || args[0] === "-s") {
  const file = args[1];
  if (!file) {
    console.error("No file specified and no last file found");
    process.exit(1);
  }
  await SubmitCode(file);
  process.exit(0);
} else if (args[0] === "-p") {
  if (args[1]) {
    try {
      CommitCppWithDir(args[1], args[2]);
      process.exit(0);
    } catch (err) {
      const error = err as Error;
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.error("Usage: codetest -p <filename.cpp>");
    process.exit(1);
  }
} else if (args[0] === "--export-types") {
  if (!args[1]) {
    console.error("You need to specify where to copy");
    process.exit(1);
  }
  copyTypes(args[1]);
  process.exit(0);
}else if (args[0] === "--get-dev") {
  copyDevJS("dev.js");
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

const configFromScript: TestScriptConfig = {
  cppFiles: [],
  CFG: {},
  ...getConfigFromScript(),
};

let childProcess: ChildProcess | undefined;

// Always run the first time
const exitCode = await runTest();

if (watchMode || (configFromScript.CFG.watch as boolean)) {
  Setup(testScriptPath, args, configFromScript);
  const watchFiles = [testScriptPath, ...configFromScript.cppFiles];
  if (args.indexOf("--verbose") !== -1)
    console.log(`>>> Watching for file changes to re-run ${watchFiles}...`);
  chokidar.watch(watchFiles).on("change", () => {
    runTest();
  });
} else {
  process.exit(exitCode);
}

export async function runTest(): Promise<number> {
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
        pathToFileURL(join(import.meta.dirname, "lib", "loader.ts")).href,
        testScriptPath,
        ...args,
      ],
      { stdio: "inherit" },
    );
    const { code } = await waitForProcess(childProcess);
    console.log(
      `>>> ${testScriptPath} exited with code ${code === 0 ? chalk.green(code.toString()) : chalk.red(code?.toString())}`,
    );
    return code ?? 1;
  } catch (e) {
    console.error("Error running test:");
    console.error(e);
    const err = e as Error & { status?: number };
    process.exit(err.status || 1);
  }
}

async function waitForProcess(
  child: ChildProcess,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
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

function getConfigFromScript(): TestScriptConfig {
  try {
    const stdout = execFileSync(process.execPath, [
      "--import",
      pathToFileURL(join(import.meta.dirname, "lib", "cpp-deps-loader.ts"))
        .href,
      testScriptPath,
      ...args,
    ]);
    try {
      return JSON.parse(stdout.toString()) as TestScriptConfig;
    } catch {
      console.error("Failed to get CPP files!");
      console.error("---stdout---");
      console.error(stdout.toString());
    }
  } catch (e) {
    console.error("Failed to get CPP files!");
    const err = e as Error & { output?: (Buffer | null)[] };
    console.error("---stdout---");
    console.error(err.output?.[1]?.toString());
    console.error("---stderr---");
    console.error(err.output?.[2]?.toString());
  }
  process.exit(1);
}
