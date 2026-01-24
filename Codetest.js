#!/usr/bin/env node
import { spawn }  from 'child_process';
import chokidar from 'chokidar';
import { join, dirname } from 'path';
import fs from 'node:fs';
import chalk from 'chalk';
import { execFileSync } from 'node:child_process';

if (process.argv.length <= 2 || process.argv.indexOf('--help')!==-1)
{
  console.log("HELP");
  console.log("[file] [parameters] [options]");
  console.log("file: path to a valid testgen file.");
  console.log("parameters: VAR=VALUE or VAR=<RANGE_START>..<RANGE_END>");
  console.log("options: --verbose;--keep-input;--watch");
  process.exit(0);
}
let args = process.argv.slice(2);
let watchMode = false;

const watchModeIndex = args.indexOf('--watch');
if (watchModeIndex !== -1) {
    args.splice(watchModeIndex, 1);
    watchMode = true;
}
let testScriptPath = args[0];
args = args.slice(1);
let testScriptDir = dirname(testScriptPath);

if(!fs.existsSync(testScriptPath)) {
    const stdTestFile = join(import.meta.dirname, 'stdTest', testScriptPath + '.js');
    if(fs.existsSync(stdTestFile)) {
        testScriptPath = stdTestFile;
        testScriptDir = process.cwd();
    }else {
        console.error(`Test script ${testScriptPath} does not exist.`);
        process.exit(1);
    }
}

let childProcess;
// Always run the first time
await runTest();

if(watchMode) {
    const cppFiles = getCppDeps();
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
        console.log(`>>> ${chalk.cyan('Running')} ${testScriptPath} ${args.join(' ')}`);
        childProcess = spawn(
            process.execPath,
            ['--import', join(import.meta.dirname, 'lib', 'loader.js'), testScriptPath, ...args],
            { stdio: 'inherit' }
        );
        const {code} = await waitForProcess(childProcess);
        console.log(`>>> ${testScriptPath} exited with code ${code == 0 ? chalk.green(code): chalk.red(code)}`);

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


function getCppDeps() {
    try{
    const stdout = execFileSync(
            process.execPath,
            ['--import', join(import.meta.dirname, 'lib', 'cpp-deps-loader.js'), testScriptPath, ...args]
        );
    return JSON.parse(stdout).cppFiles;
    }catch(e){
        console.error('Failed to get CPP files!')
        console.error('---stdout---')
        console.error(e.output[1].toString())
        console.error('---stderr---')
        console.error(e.output[2].toString())
        process.exit(1)
    }
}