#!/usr/bin/env node
import { spawn }  from 'child_process';
import chokidar from 'chokidar';
import { join, dirname } from 'path';
import { glob } from 'node:fs/promises';

let args = process.argv.slice(2);
let watchMode = false;

const watchModeIndex = args.indexOf('--watch');
if (watchModeIndex !== -1) {
    args.splice(watchModeIndex, 1);
    watchMode = true;
}
const testScriptPath = args[0];

let childProcess;
// Always run the first time
await runTest();

if(watchMode) {
    const testScriptDir = dirname(testScriptPath);
    const cppFiles = await Array.fromAsync(glob(`${testScriptDir}/*.cpp`));
    const watchFiles = [testScriptPath, ...cppFiles];

    console.log(`>>> Watching for file changes to re-run ${watchFiles}...`);
    chokidar.watch(watchFiles).on('change', (file) => {
        console.log(`>>> ${file} changed. Re-running...`);
        runTest();
    });
}

async function runTest(){
    try {        
        if(childProcess && childProcess.exitCode === null) {
            console.log(`Killing ${childProcess.pid}`);
            childProcess.kill();
            await waitForProcess(childProcess);
        }
        console.log(`>>> Running ${args.join(' ')}`);
        childProcess = spawn(
            process.execPath, 
            ['--trace-warnings','--import', join(import.meta.dirname, 'lib', 'loader.js'), ...args],
            { stdio: 'inherit' }
        );
        const {code} = await waitForProcess(childProcess);
        console.log(`>>> ${testScriptPath} exited with code ${code}`);

    } catch (e) {
        console.error("Error running test:");
        console.error(e);
        process.exit(e.status || 1);
    }
}

async function waitForProcess(child) {
  return new Promise((resolve) => {
    if(child.exitCode !== null) {
      resolve({ code: child.exitCode, signal: null });
      return;
    }
    child.on('exit', (code, signal) => {
      resolve({ code, signal });
    });
  });
}