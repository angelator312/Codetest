const files = ListSomeFiles("./", "*.cpp");
SetCpp(...files);
SetTimeout(5000);

for (const testFile of files) {
  const what = await SubmitCode(testFile, { openBrowser: false });
  Log(testFile, ":", what);
  if (!what) Fail("Failing");
}
