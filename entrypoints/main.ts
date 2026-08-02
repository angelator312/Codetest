#!/usr/bin/env node
let t: string;
try {
  if (!process.env.CODETEST_ENTRYPOINT) {
    t = "Codetest";
    await import("./Codetest.ts");
  } else if (process.env.CODETEST_LOADER === "cpp-deps") {
    t = "Cpp Deps Loader";
    await import("./cpp-deps-loader.ts");
  } else {
    t = "Loader";
    await import("./loader.ts");
  }
} catch (e) {
  console.error("Error executing script(", t, ")\n", e)
}