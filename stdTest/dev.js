SetCpp(CPP ?? "program.cpp");

for(const testFile of ListInputFiles(global.DIR ?? "test.in.d")) {
  TestSol(testFile);
}
