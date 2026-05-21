if(!process.env.CODETEST_ENTRYPOINT) {
  await import("./Codetest.ts");
} else if(process.env.CODETEST_LOADER === "cpp-deps") {
  await import("./cpp-deps-loader.ts");
} else {
  await import("./loader.ts");
}
