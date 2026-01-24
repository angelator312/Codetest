import { execSync } from "child_process";
import { globSync, readFileSync } from "node:fs";
import { diffLines } from "diff";
import chalk from "chalk";
import { formatNanoseconds, runCommand } from "./utils.js";
import { CFG } from "./Config.js";
import { Fail } from "./Out.js";

let commands;
let cppFlags;
let goldenCommandCpp;
let testCommandCpp;
let timeoutMs;

function compileCommand(key, cppFile) {
  let command = cppFile.replace(".cpp", ".exe");
  try {
    execSync(`g++ ${cppFile} ${cppFlags ?? ''} -O2 -o ${command}`, {
      encoding: "utf8",
      stdio: "inherit",
    });
  } catch (e) {
    console.error(e.message);
    Fail(`Failed to compile ${cppFile}`);
  }
  return { [key]: command };
}

function compileCommands(select) {
  if (
    !commands ||
    (select?.goldenCommand && !commands.goldenCommand) ||
    (select?.testCommand && !commands.testCommand)
  ) {
    let result = {};
    for (const [key, cppFile] of [
      ["goldenCommand", goldenCommandCpp],
      ["testCommand", testCommandCpp],
    ]) {
      if (!select || select[key]) {
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

export function SetCpp(golden, test) {
  goldenCommandCpp = golden;
  testCommandCpp = test;
}

export function SetCppFlags(flags) {
  cppFlags = flags;
}

export function SetTimeout(toMs) {
  timeoutMs = toMs;
}

export function Test() {
  CloseOutput();
  const outputFileName = GetOutput();

  let { goldenCommand, testCommand } = compileCommands();

  let startGold = process.hrtime.bigint();
  runCommand(`./${goldenCommand}`, outputFileName, "test.sol", timeoutMs);
  let endGold = process.hrtime.bigint();
  runCommand(`./${testCommand}`, outputFileName, "test.out", timeoutMs);
  let endTest = process.hrtime.bigint();
  if (CFG.verbose) {
    console.log(
      `Golden: ${formatNanoseconds(endGold - startGold)}, Test: ${formatNanoseconds(
        endTest - endGold,
      )}`,
    );
  }
  try {
    diff("test.sol", "test.out");

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
    console.error("Test failed");
    process.exit(1);
  }
}

let iterators = {};
let iterKeys;
let currentIterator;

export function __initializeIterator(name, min, max) {
  iterators[name] = { min, max };
}

function updateGlobals() {
  for (let i = 0; i < iterKeys.length; i++) {
    const key = iterKeys[i];
    globalThis[key] = currentIterator[i];
  }
  if (CFG.verbose) {
    console.log("Test: " + currentIteratorDescription());
  }
}

function incIterator() {
  let idx = iterKeys.length - 1;
  while (idx >= 0) {
    let key = iterKeys[idx];
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

function currentIteratorDescription() {
  let s = [];
  for (let i = 0; i < iterKeys.length; i++) {
    s.push(iterKeys[i] + " = " + currentIterator[i]);
  }
  return s.join(", ");
}

export function NextCase(p) {
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

export function ListInputFiles(dirName) {
  return globSync(`${dirName}**/*.in`);
}

export function TestSol(fileName) {
  let { goldenCommand } = compileCommands({ goldenCommand: true });
  const testFileBase = fileName.replace(/\.in$/, "");
  let outputFileName = testFileBase + ".out";

  let startGold = process.hrtime.bigint();
  runCommand(`./${goldenCommand}`, fileName, outputFileName, timeoutMs);
  let endGold = process.hrtime.bigint();
  if (CFG.verbose) {
    console.log(`Golden: ${formatNanoseconds(endGold - startGold)}`);
  }
  try {
    let solFileName = testFileBase + ".sol";
    diff(solFileName, outputFileName);
    console.log(chalk.green("Test passed for: " + fileName));
  } catch (e) {
    console.error(chalk.red("Test failed for: " + fileName));
    process.exit(1);
  }
}

function diffCmd(file1, file2) {
  execSync(`diff --color -u ${file1} ${file2}`, {
    encoding: "utf8",
    stdio: "inherit",
  });
}

function diff(file1, file2) {
  const f1 = readFileSync(file1, "utf8");
  const f2 = readFileSync(file2, "utf8");

  const differences = diffLines(f1, f2, { ignoreNewlineAtEof : true})
  const hasDiff = differences.some((c) => c.added || c.removed)
  if(hasDiff){
    printColoredDiff(differences);
  }
  if(hasDiff){
    throw Error('Test Failed');
  }
}


function printColoredDiff(differences) {
  
  let oldLineNumber = 1;
  let newLineNumber = 1;
  
  differences.forEach((part) => {
    const lines = part.value.split('\n');
    // Remove last empty line if the part doesn't end with newline
    if (lines[lines.length - 1] === '' && !part.value.endsWith('\n')) {
      lines.pop();
    }
    
    lines.forEach((line) => {
      if (part.added) {
        console.log(chalk.green(`+ ${newLineNumber.toString().padStart(4)} | ${line}`));
        newLineNumber++;
      } else if (part.removed) {
        console.log(chalk.red(`- ${oldLineNumber.toString().padStart(4)} | ${line}`));
        oldLineNumber++;
      } else {
        console.log(chalk.gray(`  ${oldLineNumber.toString().padStart(4)} | ${line}`));
        oldLineNumber++;
        newLineNumber++;
      }
    });
  });
}