/// <reference path="../types/index.d.ts" />
if (typeof CPP !== "string") throw new Error("CPP isn't valid");

SetConfig({ watch: true });
SetWatchables(CPP, CPP.replace(".cpp", "Grader.d/*.in"));
SetWatchables(CPP, CPP.replace(".cpp", "Grader.d/*.sol"));
SetCpp(CPP.replace(".cpp", "Grader.cpp"));

SetCppFlags("-DMYFLAG");
SetTimeout(5000);

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(".cpp", "Grader.d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile);
  }
}
