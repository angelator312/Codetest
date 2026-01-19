export * from "./Out.js";
export * from "./Random.js";
export * from "./Generate.js";
export * from "./Test.js";

import { __initializeIterator } from "./Test.js";
import { CFG } from "./Config.js";

export function __initialize(globalObject) {
  for (const v of process.argv.slice(2)) {
    if (v === "--verbose") {
      CFG.verbose = true;
      continue;
    }
    if (v === "--keep-input") {
      CFG.keepInputFiles = true;
      continue;
    }
    var parts = v.split("=");
    if (parts.length != 2) {
      console.error("Invalid argument: " + v);
      continue;
    }
    const name = parts[0];
    const value = parts[1];
    // set global variable
    if (value.match(/^\d+$/)) {
      globalObject[name] = parseInt(value);
    } else if (value.match(/^\d+\.\d+$/)) {
      globalObject[name] = parseFloat(value);
    } else if (value.match(/^\d+\.\.\d+$/)) {
      let range = value.split("..").map((s) => parseInt(s));
      __initializeIterator(name, range[0], range[1]);
    }
  }
}
