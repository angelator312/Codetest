import { execSync } from "child_process";
import { globSync, readFileSync } from "node:fs";
import { diffLines } from "diff";
import chalk from "chalk";
import { formatNanoseconds, runCommand } from "./utils.ts";
import { CFG } from "./Config.ts";
import { Fail, CloseOutput, GetOutput, SaveOutputAs, SetOutput } from "./Out.ts";
import path from "node:path";
import os from "node:os";

interface Commands {
  goldenCommand?: string;
  testCommand?: string;
}

let commands: Commands | undefined;
let cppFlags: string | undefined;
let goldenCommandCpp: string | undefined;
let testCommandCpp: string | undefined;
let timeoutMs: number | undefined;
const ERROR_FILE_NAME = path.join(os.homedir(), ".config", "codetest", "last.err");

interface IteratorRange {
  min: number;
  max: number;
}

interface Iterators {
  [key: string]: IteratorRange;
}

export class DiffError extends Error{
}

let iterators: Iterators = {};
let iterKeys: string[] | undefined;
let currentIterator: number[] | undefined;

function compileCommand(key: string, cppFile: string): Record<string, string> {
  const command = cppFile.replace(".cpp", ".exe");
  try {
    execSync(`g++ ${cppFile} ${cppFlags ?? ""} -O2 -o ${command}`, {
      encoding: "utf8",
      stdio: "inherit",
    });
  } catch (e) {
    const error = e as Error;
    console.error(error.message);
    Fail(`Failed to compile ${cppFile}`);
  }
  return { [key]: command };
}

function compileCommands(select?: { goldenCommand?: boolean; testCommand?: boolean }): Commands {
  if (
    !commands ||
    (select?.goldenCommand && !commands.goldenCommand) ||
    (select?.testCommand && !commands.testCommand)
  ) {
    let result: Record<string, string> = {};
    for (const [key, cppFile] of [
      ["goldenCommand", goldenCommandCpp],
      ["testCommand", testCommandCpp],
    ] as [string, string | undefined][]) {
      if (!select || select[key as keyof typeof select]) {
        if (!cppFile) {
          Fail(
            "Command C++ file for " +
              key +
              " is not set. Call SetCpp(golden, test) first.",
          );
        }
        result = {
          ...result,
          ...compileCommand(key, cppFile),
        };
      }
      commands = { ...commands, ...result };
    }
  }
  return commands;
}

export function SetCpp(golden: string, test?: string): void {
  goldenCommandCpp = golden;
  testCommandCpp = test;
}
export function SetWatchables(...golden: string[]): void {
}

export function SetCppFlags(flags: string): void {
  cppFlags = flags;
}

export function SetTimeout(toMs: number): void {
  timeoutMs = toMs;
}

export function Test(): void {
  CloseOutput();
  const outputFileName = GetOutput();

  if (!outputFileName) {
    Fail("Output file name not set");
    return;
  }

  let { goldenCommand, testCommand } = compileCommands();

  if (!goldenCommand || !testCommand) {
    Fail("Commands not compiled");
    return;
  }

  const solFileName = outputFileName.replace(/\.[^.]+$/, ".sol");
  const outFileName = outputFileName.replace(/\.[^.]+$/, ".out");
  let startGold = process.hrtime.bigint();
  runCommand(`./${goldenCommand}`, outputFileName, solFileName, timeoutMs ?? 0, os.devNull);
  let endGold = process.hrtime.bigint();
  runCommand(`./${testCommand}`, outputFileName, outFileName, timeoutMs ?? 0, ERROR_FILE_NAME);
  let endTest = process.hrtime.bigint();
  if (CFG.verbose) {
    console.log(
      `Golden: ${formatNanoseconds(endGold - startGold)}, Test: ${formatNanoseconds(
        endTest - endGold,
      )}`,
    );
  }
  try {
    diff(solFileName, outFileName, ERROR_FILE_NAME);

    if (CFG.verbose) {
      console.log("Test passed for: " + currentIteratorDescription());
    }
    if (CFG.keepInputFiles) {
      SaveOutputAs(
        `${currentIteratorDescription().replace(/, /g, "-").replace(/ = /g, "-")}`,
      );
    }
    SetOutput(outputFileName); // reopen output file
  } catch (e) {
    console.error("Test failed " + solFileName + " " + outFileName + " " + outputFileName);
    process.exit(1);
  }
}

export function __initializeIterator(name: string, min: number, max: number): void {
  iterators[name] = { min, max };
}

function updateGlobals(): void {
  if (!iterKeys || !currentIterator) return;
  for (let i = 0; i < iterKeys.length; i++) {
    const key = iterKeys[i];
    (globalThis as Record<string, unknown>)[key] = currentIterator[i];
  }
  if (CFG.verbose) {
    console.log("Test: " + currentIteratorDescription());
  }
}

function incIterator(): boolean {
  if (!iterKeys || !currentIterator) return false;
  let idx = iterKeys.length - 1;
  while (idx >= 0) {
    const key = iterKeys[idx];
    if (currentIterator[idx] < iterators[key].max) {
      currentIterator[idx]++;
      return true;
    } else {
      currentIterator[idx] = iterators[key].min;
      idx--;
    }
  }
  return false;
}

function currentIteratorDescription(): string {
  if (!iterKeys || !currentIterator) return "";
  const s: string[] = [];
  for (let i = 0; i < iterKeys.length; i++) {
    s.push(iterKeys[i] + " = " + currentIterator[i]);
  }
  return s.join(", ");
}

export function NextCase(): boolean {
  // First time initialize currentIterator and return true
  if (!iterKeys) {
    iterKeys = Object.keys(iterators);
    currentIterator = iterKeys.map((k) => iterators[k].min);
    updateGlobals();
    return true;
  }
  const r = incIterator();
  updateGlobals();
  return r;
}

export function ListInputFiles(dirName: string): string[] {
  return globSync(`${dirName}**/*.in`);
}

export function ListSomeFiles(dirName: string, glob: string): string[] {
  return globSync(`${dirName}**/${glob}`);
}

export function TestSol(fileName: string,checkerFunc?:(string,string,string)=>void): void {
  let { goldenCommand } = compileCommands({ goldenCommand: true });

  if (!goldenCommand) {
    Fail("Golden command not set");
    return;
  }

  const testFileBase = fileName.replace(/\.in$/, "");
  const outputFileName = testFileBase + ".out";

  let startGold = process.hrtime.bigint();
  runCommand(
    "." + path.sep + goldenCommand,
    fileName,
    outputFileName,
    timeoutMs ?? 0,
    ERROR_FILE_NAME,
    ()=>{console.error(readFileSync(ERROR_FILE_NAME).toString())}
  );
  let endGold = process.hrtime.bigint();
  if (CFG.verbose) {
    console.log(`Golden: ${formatNanoseconds(endGold - startGold)}`);
  }
  try {
    const solFileName = testFileBase + ".sol";
    if (checkerFunc) checkerFunc(solFileName, outputFileName, ERROR_FILE_NAME);
    else diff(solFileName, outputFileName, ERROR_FILE_NAME);
    console.log(chalk.green("Test passed for: " + fileName));
  } catch (e) {
    if(e instanceof DiffError){
      console.error(chalk.red("Test failed for: " + fileName));
    } else {
      console.error(chalk.red("Failed comparing output to solution: "));
      console.error(e);
    }
    process.exit(1);
  }
}

function diffCmd(file1: string, file2: string): void {
  execSync(`diff --color -u ${file1} ${file2}`, {
    encoding: "utf8",
    stdio: "inherit",
  });
}

function diff(file1: string, file2: string, errFileName: string): void {
  const f1 = readFileSync(file1, "utf8");
  const f2 = readFileSync(file2, "utf8");

  const differences = diffLines(f1, f2, {
    ignoreNewlineAtEof: true,
    ignoreWhitespace: true,
  });
  const hasDiff = differences.some((c) => c.added || c.removed);
  if (hasDiff) {
    if (errFileName)
      process.stderr.write(readFileSync(errFileName).toString());
    printColoredDiff(differences);
  }
  if (hasDiff) {
    throw new DiffError("Test Failed");
  }
}

export function printColoredDiff(differences: { value: string; added?: boolean; removed?: boolean }[]): void {
  let oldLineNumber = 1;
  let newLineNumber = 1;

  differences.forEach((part) => {
    const lines = part.value.split("\n");
    // Remove last empty line if the part doesn't end with newline
    if (lines[lines.length - 1] === "" && !part.value.endsWith("\n")) {
      lines.pop();
    }

    lines.forEach((line) => {
      if (part.added) {
        console.log(
          chalk.green(`+ ${newLineNumber.toString().padStart(4)} | ${line}`),
        );
        newLineNumber++;
      } else if (part.removed) {
        console.log(
          chalk.red(`- ${oldLineNumber.toString().padStart(4)} | ${line}`),
        );
        oldLineNumber++;
      } else {
        console.log(
          chalk.gray(`  ${oldLineNumber.toString().padStart(4)} | ${line}`),
        );
        oldLineNumber++;
        newLineNumber++;
      }
    });
  });
}
