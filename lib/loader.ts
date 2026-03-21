import * as globals from './export.ts';

// Optionally avoid overwriting existing properties
for (const [name, value] of Object.entries(globals)) {
  (globalThis as Record<string, unknown>)[name] = value;
}

globals.__initialize(globalThis);
