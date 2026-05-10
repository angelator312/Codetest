#!/usr/bin/env bun

import { Glob } from "bun";

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
  metafile: true,
  compile: {
    outfile: `${outDir}/codetest`,
  },
});

if (result.metafile) {
  await Bun.write(`${outDir}/meta.json`, JSON.stringify(result.metafile));
}
