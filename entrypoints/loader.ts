import * as globals from '../lib/export.ts';

// Optionally avoid overwriting existing properties
for (const [name, value] of Object.entries(globals)) {
  (globalThis as Record<string, unknown>)[name] = value;
}

globals.__initialize(globalThis);

// Run the actual app
await import(process.env.CODETEST_ENTRYPOINT);
