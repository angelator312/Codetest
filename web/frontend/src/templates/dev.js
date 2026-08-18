/// <reference path="../types/index.d.ts" />
const getExtensionRegex = /\.[^.]+$/;

if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetCpp(CPP);
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.sol"));
SetCppFlags("-DMYFLAG");
SetTimeout(global.TIME ?? 5000);

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile);
  }
}