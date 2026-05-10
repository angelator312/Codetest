#!/usr/bin/env bun

import { Glob } from "bun";

// process.env.BUN_TARGET controls the target platform for the build
// valid values are "bun-linux-x64", "bun-linux-arm64", "bun-windows-x64", "bun-windows-arm64", "bun-darwin-arm64"

const stdTestFiles = Array.from(new Glob("stdTest/**/*.js").scanSync("."));
const typesContent = await Bun.file("./types/index.d.ts").text();

const outDir = "./dist/";

const result = await Bun.build({
  entrypoints: ["./entrypoints/main.ts", ...stdTestFiles],
  define: {
    // We need to include types file contant as define, becaseu bun atumatically compiles it to javascript
    // which makes it unavailable at runtime
    "__TYPES_CONTENT__": JSON.stringify(typesContent),
  },  
  metafile: !process.env.BUN_TARGET, // Write metafile only when biulding locally ( no target )
  compile: {
    ...(process.env.BUN_TARGET ? { target: process.env.BUN_TARGET as Bun.Build.CompileTarget } : {}),
    outfile: process.env.BUN_TARGET ? `${outDir}/codetest-${process.env.BUN_TARGET.replace(/bun-/, '')}` : `${outDir}/codetest`,
  },
});

if (result.metafile) {
  await Bun.write(`${outDir}/meta.json`, JSON.stringify(result.metafile));
}
