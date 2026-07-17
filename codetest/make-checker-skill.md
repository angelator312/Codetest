---
name: make-checkers
description: Generate dev.js/dev.ts checker functions for CP problem test harnesses using the codetest framework
metadata:
  framework: codetest
  language: js/ts/cpp
---

# Make Checkers

You are a maker of `checker` functions for competitive programming test harnesses using the **codetest** framework. Your job is to produce a complete `dev.js` or `dev.ts` file that compiles and tests a C++ solution against `.in` / `.sol` test files.

## The `checker` function signature

```
function checker(
  fsol: string,        // path to expected-output file (.sol)
  fout: string,        // path to user-program output
  errFileName: string, // path to stderr captured from the user program
  fin: string,         // path to the input file (.in)
): void
```

Throw `new DiffError("message")` on failure; return normally on pass.

## Boilerplate

```js
/// <reference path="../../codetest.d.ts" />
const getExtensionRegex = /\.[^.]+$/;

if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetConfig({ watch: true });
SetCpp(CPP);
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.sol"));
SetCppFlags("-DMYFLAG");
SetTimeout(5000);

function checker(fsol, fout, errFileName, fin) {
  // — checker body —
}

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile, checker);
  }
}
```

### Variations

- **Hard-coded filename**: replace `CPP` with `const cpp = "file.cpp"` and use `cpp` everywhere; set `SetCpp(cpp)`
- **Grader**: add `SetCpp(global.GRADER ?? cpp.replace(getExtensionRegex, "Grader.cpp"))`
- **TypeScript**: type the checker params as `string`
- **SetOutput**: add `SetOutput("some.in")` after `SetCpp` for interactive-like tests
- **Extra watchables**: add more `SetWatchables(...)` for headers or other dependencies

## File reading helpers

| Function | Returns | When to use |
|---|---|---|
| `GetFileAs2DArrayOfNumbers(file)` | `number[][]` | Lines of whitespace-separated numbers |
| `GetFileAsArrayOfStrings(file)` | `string[]` | Each line is a raw string |
| `GetFileAsArrayOfNumbers(file)` | `number[]` | One number per line |
| `GetFileAsArrayOfSimpleTestCases(file)` | `{ n: number, line: string }[]` | Integer N followed by a string |
| `GetFileAsArrayOfSimple2TestCases(file)` | `{ n: number, k: number, line: string }[]` | Two ints N, K then a string |
| `GetFileAsArrayOfOptionalSequences(file)` | `OptionalSequence[]` | Lines with sequences or "-1" |

When input is unstructured, use `GetFileAsArrayOfStrings(fin)` and parse manually.

## Checker patterns

### 1. Exact comparison

```js
const expected = GetFileAs2DArrayOfNumbers(fsol);
const actual   = GetFileAs2DArrayOfNumbers(fout);
for (let i = 0; i < expected.length; i++) {
  for (let j = 0; j < expected[i].length; j++) {
    if (expected[i][j] !== actual[i][j]) {
      PrintFile(errFileName);
      throw new DiffError(`Mismatch at line ${i} col ${j}`);
    }
  }
}
```

### 2. Value / constraint check

```js
const cases = GetFileAsArrayOfSimpleTestCases(fin);
const output = GetFileAs2DArrayOfNumbers(fout);
for (let i = 0; i < cases.length; i++) {
  const { n } = cases[i];
  const userArr = output[i];
  if (userArr.length !== n) {
    PrintFile(errFileName);
    throw new DiffError(`Case ${i+1}: expected ${n} numbers, got ${userArr.length}`);
  }
}
```

### 3. Optimality check

```js
const okTokens   = GetFileAsArrayOfStrings(fsol);
const userTokens = GetFileAsArrayOfStrings(fout);
// parse both, then compare cost
if (userCost > okCost) {
  PrintFile(errFileName);
  throw new DiffError("Not optimal");
}
```

### 4. Simulation

```js
const input = GetFileAsArrayOfStrings(fin);
const user  = GetFileAsArrayOfStrings(fout);
const ops   = parseInt(user[0]);
// apply each operation, assert final state
```

## Important functions

- `PrintFile(errFileName)` — print captured stderr to console (call before throwing)
- `process.stderr.write(...)` — write to stderr from inside checker
- `console.log(...)` — diagnostics visible to the user
- `DiffError` — throw this on test failure

## Rules

1. Never silently ignore malformed output — throw a descriptive `DiffError` with the failing test case
2. Call `PrintFile(errFileName)` before throwing when stderr is relevant
3. Use `console.log` for diagnostics
4. Track separate indices (`inIdx`, `okIdx`, `userIdx`) when reading from multiple files
5. Only compare against `fsol` when the problem has a unique correct answer; otherwise validate independently
6. Use `GetFileAsArrayOfStrings` for unstructured text, `GetFileAs2DArrayOfNumbers` for numeric matrices, `GetFileAsArrayOfSimpleTestCases` for N+string formats

## Implementation examples

### Example 1: Simple sum check

Statement:
Given an integer N followed by N integers, compute and print their sum. Each line of the input file contains one test case: first an integer N, then N space-separated integers. The output file should contain one integer per test case — the sum.

Grader:
The checker reads the first value of the expected output (`fsol`) and the first value of the user output (`fout`). If they differ, it prints the stderr and throws `DiffError`.

```js
/// <reference path="../../codetest.d.ts" />
const getExtensionRegex = /\.[^.]+$/;
if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetConfig({ watch: true });
SetCpp(CPP);
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.sol"));
SetCppFlags("-DMYFLAG");
SetTimeout(5000);

function checker(fsol, fout, errFileName, fin) {
  const expected = GetFileAs2DArrayOfNumbers(fsol)[0][0];
  const actual   = GetFileAs2DArrayOfNumbers(fout)[0][0];
  PrintFile(errFileName);
  if (expected !== actual) {
    console.log("Expected:", expected, "Got:", actual);
    throw new DiffError("Sum mismatch");
  }
}

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile, checker);
  }
}
```

### Example 2: TypeScript value check

Statement:
For each test case, read an integer n and a string. Output exactly n space-separated integers. The output format is one line per test case.

Grader:
The checker reads the input as `SimpleTestCase[]` (n + string) and the output as a 2D number array. For each test case it validates that the user's output line has exactly n numbers.

```ts
/// <reference path="../../codetest.d.ts" />
const getExtensionRegex = /\.[^.]+$/;
if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetConfig({ watch: true });
SetCpp(CPP);
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.sol"));
SetCppFlags("-DMYFLAG");
SetTimeout(5000);

interface TestCase {
  n: number;
  line: string;
}

function checker(sol: string, out: string, errFileName: string, fin: string) {
  const tests: TestCase[] = GetFileAsArrayOfSimpleTestCases(fin);
  const output = GetFileAs2DArrayOfNumbers(out);
  for (let i = 0; i < tests.length; i++) {
    const { n } = tests[i];
    const userArr = output[i];
    if (!userArr || userArr.length !== n) {
      PrintFile(errFileName);
      throw new DiffError(`Case ${i+1}: expected ${n} numbers, got ${userArr.length}`);
    }
  }
}

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile, checker);
  }
}
```

### Example 3: Hard-coded filename with grader

Statement:
Read two integers a and b from each test case, print their product. The solution is in `solution.cpp`. A grader file `Grader.cpp` wraps the solution.

Grader:
The checker compares expected output (`fsol`) against user output (`fout`) line by line, element by element using exact numeric comparison.

```js
/// <reference path="../../codetest.d.ts" />
const getExtensionRegex = /\.[^.]+$/;
const cpp = "solution.cpp";
if (typeof cpp !== "string") throw new Error("cpp isn't valid");
SetConfig({ watch: true });
SetWatchables(cpp, cpp.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(cpp, cpp.replace(getExtensionRegex, ".d/*.sol"));
SetWatchables(cpp, cpp.replace(getExtensionRegex, ".h"));
SetCpp(global.GRADER ?? cpp.replace(getExtensionRegex, "Grader.cpp"));
SetCppFlags("-DMYFLAG");
SetTimeout(5000);

function checker(fsol, fout, errFileName, fin) {
  const expected = GetFileAs2DArrayOfNumbers(fsol);
  const actual   = GetFileAs2DArrayOfNumbers(fout);
  for (let i = 0; i < expected.length; i++) {
    for (let j = 0; j < expected[i].length; j++) {
      if (expected[i][j] !== actual[i][j]) {
        PrintFile(errFileName);
        throw new DiffError(`Mismatch at line ${i} col ${j}`);
      }
    }
  }
}

for (const testFile of ListInputFiles(
  global.DIR ?? cpp.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile, checker);
  }
}
```

### Example 4: Complex validation (frequency + distinct differences)

Statement:
For each test case, read an integer n. Output a single line containing 4n integers. Each value from 1 to n must appear exactly 4 times. For each value x, the three adjacent differences between consecutive occurrences must be pairwise distinct.

Grader:
The checker parses the input as `SimpleTestCase[]`. For each case it reads the user output as a number array, validates that every value is in [1, n], that each value appears exactly 4 times, and that the distances between consecutive occurrences of each value are all different.

```js
/// <reference path="../../codetest.d.ts" />
const getExtensionRegex = /\.[^.]+$/;
if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetConfig({ watch: true });
SetCpp(CPP);
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.sol"));
SetCppFlags("-DMYFLAG");
SetTimeout(5000);

function checker(okFile, userFile, errFileName, fin) {
  const inputTokens = GetFileAsArrayOfSimpleTestCases(fin);
  const userTokens = GetFileAs2DArrayOfNumbers(userFile);
  let userIdx = 0;
  const t = inputTokens.length;

  for (let caseNum = 0; caseNum < t; caseNum++) {
    const n = inputTokens[caseNum].n;
    if (isNaN(n)) continue;
    const userArray = userTokens[userIdx++];
    if (!userArray || userArray.length !== 4 * n) {
      throw new DiffError(
        `Case ${caseNum+1}: expected ${4 * n} values, got ${userArray.length}`
      );
    }
    const positions = {};
    for (let i = 1; i <= n; i++) positions[i] = [];
    for (let i = 0; i < userArray.length; i++) {
      const val = userArray[i];
      if (val < 1 || val > n) {
        throw new DiffError(
          `Case ${caseNum+1}: value ${val} out of range [1, ${n}]`
        );
      }
      positions[val].push(i);
    }
    for (let x = 1; x <= n; x++) {
      const pos = positions[x];
      if (pos.length !== 4) {
        throw new DiffError(
          `Case ${caseNum+1}: number ${x} appears ${pos.length} times, expected 4`
        );
      }
      const d1 = pos[1] - pos[0];
      const d2 = pos[2] - pos[1];
      const d3 = pos[3] - pos[2];
      if (d1 === d2 || d2 === d3 || d1 === d3) {
        PrintFile(errFileName);
        throw new DiffError(`Case ${caseNum+1}: differences not distinct for value ${x}: ${d1} ${d2} ${d3}`);
      }
    }
  }
}

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile, checker);
  }
}
```

### Example 5: Optimality (cost ≤ limit)

Statement:
Given a bracket string of length n and a maximum allowed deletions k. Output a binary mask of length n where '1' means delete and '0' means keep. The longest regular bracket subsequence (LRBS) of the remaining string must have the same length as the optimal solution, and you may not delete more than k characters.

Grader:
The checker reads the input as `Simple2TestCase[]` (n, k, string) and the expected/user output as string arrays. It computes the LRBS cost of the remaining string after applying the mask and compares it against the optimal. Throws on excess deletions or suboptimal cost.

```js
/// <reference path="../../codetest.d.ts" />
const getExtensionRegex = /\.[^.]+$/;
SetCpp("c.cpp");
SetOutput("bracket.in");
SetConfig({ watch: true });

function getCost(str) {
  let open = 0, len = 0;
  for (const ch of str) {
    if (ch === "(") open++;
    else if (ch === ")" && open > 0) { open--; len += 2; }
  }
  return len;
}

function checker(okFile, userFile, errFileName, fin) {
  const cases = GetFileAsArrayOfSimple2TestCases(fin);
  const okTokens = GetFileAsArrayOfStrings(okFile);
  const userTokens = GetFileAsArrayOfStrings(userFile);
  let okIdx = 0, userIdx = 0;

  for (let i = 0; i < cases.length; i++) {
    const { n, k, line } = cases[i];
    const okMask = okTokens[okIdx++];
    const userMask = userTokens[userIdx++];

    if (!userMask || userMask.length !== n) {
      throw new DiffError(`Case ${i+1}: output length ${userMask?.length}, expected ${n}`);
    }

    let userDeletions = 0, userStr = "", okDeletions = 0, okStr = "";
    for (let j = 0; j < n; j++) {
      if (userMask[j] === "1") userDeletions++;
      else userStr += line[j];
      if (okMask[j] === "1") okDeletions++;
      else okStr += line[j];
    }
    if (userDeletions > k) {
      throw new DiffError(`Case ${i+1}: deleted ${userDeletions}, exceeds limit ${k}`);
    }
    if (getCost(userStr) !== getCost(okStr)) {
      PrintFile(errFileName);
      throw new DiffError(`Case ${i+1}: cost mismatch`);
    }
  }
}

for (const testFile of ListInputFiles(
  global.DIR ?? "c.d",
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile, checker);
  }
}
```

### Example 6: Minimal (no custom checker, default diff)

Statement:
Read two integers a and b from each test case, print their sum. The expected output is unique and can be compared by default diff.

Grader:
No custom checker needed. `TestSol(testFile)` uses the built-in file diff to compare expected vs actual output. The `-fsanitize` flag helps catch undefined behavior and memory errors.

```js
/// <reference path="../../codetest.d.ts" />
const getExtensionRegex = /\.[^.]+$/;
if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetConfig({ watch: true });
SetCpp(CPP);
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.sol"));
SetCppFlags("-DMYFLAG -fsanitize=address,undefined");
SetTimeout(5000);

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile);
  }
}
```

### Example 7: Optional sequences (non-decreasing validation)

Statement:
Given N integers, find any non-decreasing subsequence of length at least 2. A non-decreasing subsequence is a sequence where elements appear in the original order and each element is >= the previous one. If no such subsequence exists, output -1.

Each input line: an integer N followed by N space-separated integers.
Each output line: either space-separated integers (the subsequence) or a single -1.

Grader:
The checker reads the input as a 2D number array and the user output as `OptionalSequence[]`. For each test case it validates the output independently of any solution file. If the user returned a sequence, it must be non-decreasing and at least 2 elements long. The checker does not compare against `fsol` — many valid answers exist.

```js
/// <reference path="../../codetest.d.ts" />
const getExtensionRegex = /\.[^.]+$/;
if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetConfig({ watch: true });
SetCpp(CPP);
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.sol"));
SetCppFlags("-DMYFLAG");
SetTimeout(5000);

function checker(fsol, fout, errFileName, fin) {
  const inputs  = GetFileAs2DArrayOfNumbers(fin);
  const outputs = GetFileAsArrayOfOptionalSequences(fout);

  if (inputs.length !== outputs.length) {
    if (errFileName) PrintFile(errFileName);
    console.log(`Expected ${inputs.length} output lines, got ${outputs.length}`);
    throw new DiffError("Line count mismatch");
  }

  for (let i = 0; i < outputs.length; i++) {
    const N = inputs[i][0];
    const arr = inputs[i].slice(1);
    const out = outputs[i];

    if (out.is_ok === 0) continue;

    if (out.is_ok === 1) {
      const seq = out.sequence;

      if (seq.length < 2) {
        if (errFileName) PrintFile(errFileName);
        console.log(`Case ${i+1}: sequence length ${seq.length} < 2`);
        throw new DiffError(`Sequence too short at line ${i+1}`);
      }

      for (let j = 1; j < seq.length; j++) {
        if (seq[j] < seq[j-1]) {
          if (errFileName) PrintFile(errFileName);
          console.log(`Case ${i+1}: ${seq[j-1]} > ${seq[j]} at position ${j}`);
          throw new DiffError(`Not non-decreasing at line ${i+1}`);
        }
      }
    }
  }
}

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile, checker);
  }
}
```

### Example 8: Operation simulation (prefix swap)

Statement:
You are given two strings s and t consisting of letters 'a' and 'b'. In one operation you can choose a prefix of s (length a) and a prefix of t (length b) and swap them. Output the minimum number of operations followed by the operations themselves (each as two integers a b). After all operations, one string must consist only of 'a's and the other only of 'b's.

Grader:
The checker simulates all user operations on the input strings. It validates operation bounds (prefix lengths within string lengths) and checks the final state — one string must be all 'a', the other all 'b'. The solution output is skipped over (used as a reference for optimality but not compared).

```ts
/// <reference path="../../codetest.d.ts" />
const getExtensionRegex = /\.[^.]+$/;
if (typeof CPP !== "string") throw new Error("CPP isn't valid");
SetConfig({ watch: true });
SetCpp(CPP);
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.in"));
SetWatchables(CPP.replace(getExtensionRegex, ".d/*.sol"));
SetCppFlags("-DMYFLAG");
SetTimeout(5000);

function checker(okFile: string, userFile: string, errFileName: string, fin: string) {
  const input = GetFileAsArrayOfStrings(fin);
  const user = GetFileAsArrayOfStrings(userFile);
  const ok = GetFileAsArrayOfStrings(okFile);
  let inIdx = 0, userIdx = 0, okIdx = 0;

  const s = input[inIdx++]?.trim() || "";
  const t = input[inIdx++]?.trim() || "";

  const userOps = parseInt(user[userIdx++]);
  if (isNaN(userOps) || userOps < 0) {
    throw new DiffError("Invalid operation count");
  }

  const okOps = parseInt(ok[okIdx++] || "0");
  okIdx += okOps;

  let curS = s, curT = t;
  for (let i = 0; i < userOps; i++) {
    const parts = user[userIdx++].trim().split(/\s+/);
    const a = parseInt(parts[0]), b = parseInt(parts[1]);
    if (a < 0 || a > curS.length || b < 0 || b > curT.length) {
      throw new DiffError(`Operation ${i+1}: prefix out of bounds`);
    }
    const sPref = curS.substring(0, a), sSuff = curS.substring(a);
    const tPref = curT.substring(0, b), tSuff = curT.substring(b);
    curS = tPref + sSuff;
    curT = sPref + tSuff;
  }

  const allA = (str: string) => /^a+$/.test(str);
  const allB = (str: string) => /^b+$/.test(str);
  if (!((allA(curS) && allB(curT)) || (allB(curS) && allA(curT)))) {
    PrintFile(errFileName);
    throw new DiffError("Final state invalid");
  }
}

for (const testFile of ListInputFiles(
  global.DIR ?? CPP.replace(getExtensionRegex, ".d"),
)) {
  if (testFile.indexOf(".") !== 0) {
    TestSol(testFile, checker);
  }
}
```
