import { existsSync } from "fs";
import { join } from "path";

export function isBun(): boolean {
  return process.versions.bun !== undefined;
}

export function isBunSingleExecutable(): boolean {
  return (isBun() && existsSync(join(import.meta.dirname, "..", "entrypoints", "main.js")));
}
