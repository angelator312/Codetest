#!/usr/bin/env node
import { execFileSync }  from 'child_process';
import { join } from 'path';

try {
    execFileSync(
        process.execPath, 
        ['--import', join(import.meta.dirname, 'lib', 'loader.js')].concat(process.argv.slice(2)),
        { stdio: 'inherit' }
    );
} catch (e) {
    process.exit(e.status || 1);
}
