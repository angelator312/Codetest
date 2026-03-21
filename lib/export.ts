export * from "./Out.ts";
export * from "./Random.ts";
export * from "./Generate.ts";
export * from "./Test.ts";
export * from "./Config.ts";
export { SubmitCode } from "./SubmitCode.ts";

import { __initializeIterator } from "./Test.ts";
import { CFG } from "./Config.ts";
import { CommandFailure, Failure } from "./utils.ts";
import chalk from 'chalk';

export function __initialize(globalObject: typeof globalThis): void {
  for (const v of process.argv.slice(2)) {
    if (v === "--verbose") {
      CFG.verbose = true;
      continue;
    }
    if (v === "--keep-input") {
      CFG.keepInputFiles = true;
      continue;
    }
    const parts = v.split("=");
    if (parts.length !== 2) {
      console.error("Invalid argument: " + v);
      continue;
    }
    const name = parts[0];
    const value = parts[1];
    // set global variable
    if (value.match(/^\d+$/)) {
      (globalObject as Record<string, unknown>)[name] = parseInt(value);
    } else if (value.match(/^\d+\.\d+$/)) {
      (globalObject as Record<string, unknown>)[name] = parseFloat(value);
    } else if (value.match(/^\d+\.\.\d+$/)) {
      const range = value.split("..").map((s) => parseInt(s));
      __initializeIterator(name, range[0], range[1]);
    } else {
      (globalObject as Record<string, unknown>)[name] = value;
    }
  }

  process.on('uncaughtException', (err) => {
    if (!CFG.verbose || err instanceof Failure || err instanceof CommandFailure) {
      console.error(chalk.red(err.message));
    } else {
      console.error(chalk.red(err));
    }
    process.exit(1);
  });
}
