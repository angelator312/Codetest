import { copyFileSync } from "fs";
import { join } from "path";

export default function copyTypes(file: string,) {
  copyFileSync(join(import.meta.dirname, "..", "types","index.d.ts"),file);
}
