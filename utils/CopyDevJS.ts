import { copyFileSync } from "fs";
import { join } from "path";

export default function copyDevJS(file: string,) {
  copyFileSync(join(import.meta.dirname, "..", "stdTest","dev.js"),file);
}
