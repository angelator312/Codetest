SetConfig({watch: true})
SetCpp(CPP ?? "program.cpp");
SetCppFlags("-DMYFLAG");
SetTimeout(5000)

for (const testFile of ListInputFiles(global.DIR ?? ((global.CPP ?? "").replace(".cpp", ".d") ?? "test.in.d"))) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile);
  }
}
