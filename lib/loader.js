import * as globals from './export.js';

// Optionally avoid overwriting existing properties
for (const [name, value] of Object.entries(globals)) {
  globalThis[name] = value;
}

globals.__initialize(globalThis);