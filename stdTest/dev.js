SetCpp(CPP ?? "program.cpp");
SetTimeout(5000)

for(const testFile of ListInputFiles(global.DIR ?? "test.in.d")) {
  TestSol(testFile);
}
