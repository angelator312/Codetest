/// <reference path="../types/index.d.ts" />
if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetConfig({ watch: true });
SetCpp(CPP);
SetWatchables(CPP.replace(".cpp", ".d/*.in"));
SetWatchables(CPP.replace(".cpp", ".d/*.sol"));
SetCppFlags("-DMYFLAG");
SetTimeout(5000);

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(".cpp", ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile);
  }
}
