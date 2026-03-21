import * as globals from './export.ts';
import type { ConfigType } from './Config.ts';

let cppFiles: string[] = [];

const MUST_RETURN_ITERABLE = new Set([
  'ListInputFiles'
]);

const LEAVE_AS_IS = new Set([
  'SetConfig', 'ListSomeFiles'
]);

const OVERWRITE: Record<string, () => unknown> = { 'SubmitCode': () => true };

// Optionally avoid overwriting existing properties
for (const [name, value] of Object.entries(globals)) {
  if (name === 'SetCpp') {
    (globalThis as Record<string, unknown>)[name] = (...args: string[]) => {
      cppFiles = [...cppFiles, ...args];
    };
  } else if (MUST_RETURN_ITERABLE.has(name)) {
    (globalThis as Record<string, unknown>)[name] = () => { return []; };
  } else if (LEAVE_AS_IS.has(name)) {
    (globalThis as Record<string, unknown>)[name] = value;
  } else if (name in OVERWRITE) {
    (globalThis as Record<string, unknown>)[name] = OVERWRITE[name];
  } else {
    (globalThis as Record<string, unknown>)[name] = () => {};
  }
}

globals.__initialize(globalThis);
process.on('exit', () => {
  console.log(JSON.stringify({ cppFiles, CFG: (globals as unknown as { CFG: ConfigType }).CFG }));
});
