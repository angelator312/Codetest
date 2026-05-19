/// <reference path="../types/index.d.ts" />
const getExtensionRegex=/\.[^.]+$/
if (typeof CPP !== "string") throw new Error("CPP isn't valid");

SetConfig({ watch: true });
SetWatchables(CPP, CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP, CPP.replace(getExtensionRegex, ".d/*.sol"));
SetWatchables(CPP, CPP.replace(getExtensionRegex, ".h"));
SetCpp(global.GRADER ?? CPP.replace(getExtensionRegex, "Grader.cpp"));

SetCppFlags("-DMYFLAG");
SetTimeout(5000);

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile);
  }
}
