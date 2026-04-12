/// <reference path="../../../codetest.d.ts" />
SetCpp("PF.cpp", "PFGrader.cpp");
SetOutput("test.in");
while (NextCase()) {
  for (let i = 0; i < N - 1; ++i) {
    Int(MinMax(0, 100));
    Out(Choice("+", "-", "*"));
  }
  Int(MinMax(0, 100));
  Out("=");
  Eol();
  Test();
}
