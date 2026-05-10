import { copyFileSync, writeFileSync } from "fs";
import { join } from "path";
import { isBunSingleExecutable } from "./Bun.ts";

export default function copyTypes(file: string,) {
  if (isBunSingleExecutable()) {
    // @ts-ignore
    writeFileSync(file, __TYPES_CONTENT__);
  } else {
    copyFileSync(join(import.meta.dirname, "..", "types","index.d.ts"),file);
  }
}
