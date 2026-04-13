/// <reference path="../types/index.d.ts" />
import { diffLines } from "diff";
import { readFileSync } from "fs";
const getExtensionRegex = /\.[^.]+$/;

if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetConfig({ watch: true });
SetCpp(CPP);
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.sol"));
SetCppFlags("-DMYFLAG");
SetTimeout(5000);

function checker(file1, file2, errFileName) {
  const f1 = parseInt(GetFileAsArrayOfNumbers(file1)[0], 10);
  const f2 = parseInt(GetFileAsArrayOfNumbers(file2, "utf8")[0], 10);

  const hasDiff = (f1 != f2);
  if (hasDiff) {
    if (errFileName) process.stderr.write(readFileSync(errFileName).toString());
    console.log("The difference between the two is:", f1 - f2);
  }
  if (hasDiff) {
    throw new DiffError("Test Failed");
  }
}

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile, checker);
  }
}
