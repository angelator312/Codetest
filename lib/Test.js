import { execSync } from "child_process";
import { globSync } from "node:fs";
import { formatNanoseconds } from "./utils.js";
import { CFG } from "./Config.js";
import { Fail } from "./Out.js";

let commands;
let goldenCommandCpp;
let testCommandCpp;

function compileCommand(key, cppFile) {
  let command = cppFile.replace(".cpp", ".exe");
  execSync(`g++ ${cppFile} -O2 -o ${command}`, {
    encoding: "utf8",
    stdio: "inherit",
  });
  return { [key]: command };
}

function compileCommands(select) {

  if (
    !commands ||
    ((select?.goldenCommand && !commands.goldenCommand) || (select?.testCommand && !commands.testCommand))
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

export function Test() {
  CloseOutput();
  const outputFileName = GetOutput();

  let { goldenCommand, testCommand } = compileCommands();

  let startGold = process.hrtime.bigint();
  execSync(`./${goldenCommand} < ${outputFileName} > test.sol`, {
    encoding: "utf8",
    stdio: "inherit",
  });
  let endGold = process.hrtime.bigint();
  execSync(`./${testCommand} < ${outputFileName} > test.out`, {
    encoding: "utf8",
    stdio: "inherit",
  });
  let endTest = process.hrtime.bigint();
  if (CFG.verbose) {
    console.log(
      `Golden: ${formatNanoseconds(endGold - startGold)}, Test: ${formatNanoseconds(
        endTest - endGold,
      )}`,
    );
  }
  try {
    execSync(`diff --color -u test.sol test.out`, {
      encoding: "utf8",
      stdio: "inherit",
    });
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
  execSync(`./${goldenCommand} < ${fileName} > ${outputFileName}`, {
    encoding: "utf8",
    stdio: "inherit",
  });
  let endGold = process.hrtime.bigint();
  if (CFG.verbose) {
    console.log(`Golden: ${formatNanoseconds(endGold - startGold)}`);
  }
  try {
    let solFileName = testFileBase + ".sol";
    execSync(`diff --color -u ${solFileName} ${outputFileName}`, {
      encoding: "utf8",
      stdio: "inherit",
    });
    if (CFG.verbose) {
      console.log("Test passed for: " + fileName);
    }
  } catch (e) {
    console.error("Test failed");
    process.exit(1);
  }
}
