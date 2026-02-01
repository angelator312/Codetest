const files = ListSomeFiles("./", "*.cpp");
SetCpp(...files);
SetTimeout(5000);

for (const testFile of files) {
  const what = SubmitCode(testFile, { openBrowser: false });
  Log(testFile, ":", what ? 0 : 1);
  if (!what) Fail("Failing");
}
