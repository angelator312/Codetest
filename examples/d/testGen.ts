SetOutput("test.in");
SetCpp("d-slow.cpp", "d-fast.cpp");

while (NextCase()) {
  Int(N); Eol();
  Int(M); Eol();
  Choice("R", "D", "U"); Eol();
  SetItemSeparator("");
  GenericSeq(N, (i) => Choice("R", "D", "U"));
  GenericMatrix(N, N, (x, y) => Choice(".", "#"));
  Test();
}
