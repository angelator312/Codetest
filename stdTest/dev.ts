/// <reference path="../types/index.d.ts" />

SetConfig({ watch: true })
SetCpp(CPP ?? "program.cpp");
SetCppFlags("-DMYFLAG");
SetTimeout(5000)

for (const testFile of ListInputFiles(DIR ?? ((CPP ?? "").replace(".cpp", ".d") ?? "test.in.d"))) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile);
  }
}
