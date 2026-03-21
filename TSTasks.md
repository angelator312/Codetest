# TypeScript Migration Plan (Full refactor to TypeScript)

**Repository:** @angelator312/codetest  
**Current Version:** 1.1.1  
**Module System:** ESM (`"type": "module"` in package.json)  
**Entry Point:** Codetest.js (CLI bin)

## Goal
- Convert the entire codebase to TypeScript source files (.ts) so that the repository runs TypeScript directly on Node.js.
- Do not introduce or use TypeScript `enum` constructs anywhere. Use alternatives (string literal unions, `as const` objects, or `Record` typed objects).
- Keep behavior identical to the existing application; this is a translation / type-annotation migration only (no feature changes).
- Produce a clear, reversible migration with verification steps, CI updates, and incremental risk mitigation.

## High-level approach
1. Inventory code and categorize files: runtime code, CLI scripts, test code, config files, build/dev scripts, server vs. worker code, front-end or shared libraries.
2. Add TypeScript config and dev dependencies for type checking and developer ergonomics (but do not introduce a persistent build step). Optionally use `tsc --noEmit` for type checking only.
3. Rename/translate files from JavaScript/other languages to TypeScript and add types incrementally where feasible.
4. Replace runtime-only idioms (CommonJS `require`/`module.exports`) with the project's chosen module system (see decisions below).
5. Update tooling and CI and run tests. Iterate and fix type errors until the codebase type checks and tests pass.
6. Verify runtime behavior (sanity checks, smoke tests) and then finalize.

## Assumptions & constraints
- NodeJS environment can execute TypeScript directly (no persistent build step).
- No TypeScript `enum` usage.
- You requested a detailed plan only; do not modify code now.

## Decisions (pre-configured for this repository)
Based on analysis of your codebase, the following decisions have been made:

### Module system: **ESM**
- Your `package.json` already has `"type": "module"`
- All files use `import`/`export` syntax
- Files will be renamed: `.js` → `.ts`

### File extension policy
- Use `.ts` for all TypeScript modules
- No need for `.mts`/`.cts` since the project is uniformly ESM

### Type checking approach
- Use `tsc --noEmit` for CI and local checks
- Conservative incremental: start with minimal annotations, progressively tighten types

### Type strictness strategy
- **Conservative incremental**: Start with `strict: false`, enable `allowJs: true` for gradual migration
- Progressively enable: `noImplicitAny`, `strictNullChecks`, then full `strict: true`

---

## Repository Inventory (Completed)

### File Structure Analysis

**Total JavaScript files to migrate:** 26 files (excluding `.old/` directory)

### Categorized File Listing

| Category | Files | Complexity | Notes |
|----------|-------|------------|-------|
| **CLI Entry** | `Codetest.js` | Medium | Main bin entry, shebang, watch mode, command parsing |
| **Core Library** | `lib/export.js`, `lib/loader.js`, `lib/cpp-deps-loader.js` | Medium | Module initialization, global setup |
| **Test Framework** | `lib/Test.js`, `lib/Generate.js`, `lib/Out.js`, `lib/Random.js`, `lib/Config.js`, `lib/utils.js` | Easy-Medium | Pure functions, test utilities |
| **Judge System** | `lib/judges/JudgeRegistry.js`, `lib/judges/Config.js`, `lib/judges/BaseJudge.js`, `lib/judges/CodeParser.js` | Easy | Registry pattern, config management |
| **Judge Implementations** | `lib/judges/ArenaJudge.js`, `lib/judges/PeshoJudge.js`, `lib/judges/CSESJudge.js`, `lib/judges/LibraryCJudge.js` | Medium | HTTP requests, async operations |
| **Submission** | `lib/SubmitCode.js` | Easy | Wraps judge submission |
| **Utils** | `utils/Commands.js`, `utils/CommitDirs.js` | Easy | CLI commands, git operations |
| **Standard Tests** | `stdTest/dbgDev.js`, `stdTest/dev.js` | Easy | Development test scripts |
| **Examples** | `examples/d/testGen.js`, `examples/judges/test.js` | Easy | User-facing test generators |
| **Legacy** | `.old/SubmitCode.js` | - | **Exclude from migration** |

### Complexity Assessment

**Easy (12 files)** - Pure functions, simple types:
- `lib/Random.js`, `lib/Config.js`, `lib/Out.js`, `lib/Generate.js`
- `lib/judges/BaseJudge.js`, `lib/judges/JudgeRegistry.js`, `lib/judges/CodeParser.js`
- `lib/utils.js`, `utils/CommitDirs.js`
- `stdTest/*.js`, `examples/**/*.js`

**Medium (10 files)** - Async operations, external deps, complex logic:
- `Codetest.js` - CLI parsing, watch mode, child processes
- `lib/Test.js` - Test execution, diff logic, file I/O
- `lib/SubmitCode.js` - Error handling, browser integration
- `lib/judges/Config.js` - File system operations
- `utils/Commands.js` - Interactive CLI, readline
- `lib/judges/ArenaJudge.js`, `lib/judges/PeshoJudge.js`, `lib/judges/CSESJudge.js`, `lib/judges/LibraryCJudge.js` - HTTP requests, cookies, CSRF
- `lib/export.js`, `lib/loader.js`, `lib/cpp-deps-loader.js` - Module initialization

### Dependencies Analysis

**External packages (from package.json):**
- `chalk` ^5.6.2 - Terminal colors (has types)
- `chokidar` ^5.0.0 - File watching (has types)
- `diff` ^8.0.3 - Diff utilities (has types)
- `random-seedable` ^1.0.8 - Random number generation (check for types)

**Node.js built-ins used:**
- `fs`, `path`, `os`, `child_process`, `https`, `zlib`, `readline`, `url`, `crypto` (all have `@types/node`)

### Special Considerations

1. **Shebang in `Codetest.js`**: Keep `#!/usr/bin/env node` for CLI execution
2. **Dynamic imports**: `readline` is dynamically imported in some judges - use `await import()`
3. **Global modifications**: `lib/export.js` and loaders modify `globalThis` - needs careful typing
4. **File I/O**: Judges save credentials to `~/.config/codetest/` - use `path` types
5. **HTTP requests**: Manual https requests need proper typing for responses
6. **No enums policy**: Replace any potential enums with union types or `as const` objects

---

## Repository-level changes

### 1. Add `tsconfig.json`

Create `tsconfig.json` at the repository root with the following configuration:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": false,
    "strict": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.js"
  ],
  "exclude": [
    "node_modules",
    ".old/**/*"
  ]
}
```

**Key configuration notes:**
- `module: "NodeNext"` - Required for ESM with `.ts` extensions in Node.js
- `moduleResolution: "NodeNext"` - Proper resolution for ESM imports with `.js` extensions
- `noEmit: true` - Type-checking only, no compilation output
- `allowJs: true` - Allows incremental migration (JS files coexist with TS)
- `strict: false` - Start conservative, tighten later
- `exclude` - Skip `.old/` directory and `node_modules`

### 2. Update `package.json`

Add the following scripts and devDependencies:

**Scripts to add:**
```json
"scripts": {
  "test": "exit 0",
  "typecheck": "tsc --noEmit",
  "typecheck:watch": "tsc --noEmit --watch"
}
```

**DevDependencies to add:**
```json
"devDependencies": {
  "typescript": "^5.4.0",
  "@types/node": "^20.11.0",
  "ts-node": "^10.9.0"
}
```

**Optional devDependencies (for linting):**
```json
"devDependencies": {
  "@typescript-eslint/eslint-plugin": "^7.0.0",
  "@typescript-eslint/parser": "^7.0.0",
  "eslint": "^8.57.0"
}
```

### 3. Update `.gitignore`

Add TypeScript-specific ignores:
```
# TypeScript
*.tsbuildinfo
*.tsbuildinfo.*
```

---

## ---

## Tooling & dev-dependencies

### Required devDependencies

Install the following packages:

```bash
npm install --save-dev typescript @types/node ts-node
```

**Purpose:**
- `typescript` - TypeScript compiler for type checking
- `@types/node` - Type definitions for Node.js built-ins
- `ts-node` - Optional runtime for executing `.ts` files directly (useful for development)

### Optional devDependencies (recommended for code quality)

```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint
```

**Purpose:**
- `@typescript-eslint/parser` - ESLint parser for TypeScript
- `@typescript-eslint/eslint-plugin` - TypeScript-specific lint rules
- `eslint` - Code linting framework

### For type coverage analysis (optional)

```bash
npm install --save-dev type-coverage
```

Add script: `"type-coverage": "type-coverage --detail"`

---

## File Conversion Strategy (Repository-Specific)

---

### Phase 0: Prepare repository for migration

**Actions:**
1. Commit/push any outstanding changes
2. Create a `ts-migration` branch: `git checkout -b ts-migration`
3. Install dev dependencies:
   ```bash
   npm install --save-dev typescript @types/node ts-node
   ```
4. Create `tsconfig.json` (see configuration above)
5. Update `package.json` scripts:
   ```json
   "scripts": {
     "test": "exit 0",
     "typecheck": "tsc --noEmit"
   }
   ```
6. Commit these changes:
   ```bash
   git add tsconfig.json package.json
   git commit -m "chore: Add TypeScript configuration"
   ```

---

### Phase 1: File renaming (low-risk, automated)

Since your codebase already uses ESM (`import`/`export`), renaming is straightforward.

**Rename order (by complexity - easiest first):**

#### Batch 1.1: Simple utility files (Easy)
```bash
# Core utilities - pure functions, simple types
git mv lib/Random.js lib/Random.ts
git mv lib/Config.js lib/Config.ts
git mv lib/Out.js lib/Out.ts
git mv lib/Generate.js lib/Generate.ts
git mv lib/utils.js lib/utils.ts

# Judge base classes
git mv lib/judges/BaseJudge.js lib/judges/BaseJudge.ts
git mv lib/judges/JudgeRegistry.js lib/judges/JudgeRegistry.ts
git mv lib/judges/CodeParser.js lib/judges/CodeParser.ts

# Utils
git mv utils/CommitDirs.js utils/CommitDirs.ts

# Standard tests and examples
git mv stdTest/dbgDev.js stdTest/dbgDev.ts
git mv stdTest/dev.js stdTest/dev.ts
git mv examples/d/testGen.js examples/d/testGen.ts
git mv examples/judges/test.js examples/judges/test.ts
```

**Type annotations to add:**

`lib/Random.ts`:
```typescript
export function Seed(seed: number): void;
export function MinMax(min: number, max: number): number;
```

`lib/Config.ts`:
```typescript
export interface ConfigType {
  verbose: boolean;
  keepInputFiles: boolean;
  watch: boolean;
}
export const CFG: ConfigType;
export function SetConfig(cfg: Partial<ConfigType>): void;
```

`lib/Out.ts`:
```typescript
export function SetOutput(fileName: string): void;
export function GetOutput(): string | undefined;
export function CloseOutput(): void;
export function SaveOutputAs(suffix: string): void;
export function SetItemSeparator(sep: string): void;
export function Eol(): void;
export function Out(s: string): void;
export function Log(...s: unknown[]): void;
export function Fail(msg: string): never;
```

`lib/Generate.ts`:
```typescript
export function Str(s: string): void;
export function Int(n: number): void;
export function Choice<T>(...choices: T[]): T;
export function GenericSeq<T>(size: number, p: (i: number) => T): void;
export function GenericMatrix<T>(w: number, h: number, p: (x: number, y: number) => T): void;
```

#### Batch 1.2: Test framework files (Medium)
```bash
git mv lib/Test.js lib/Test.ts
git mv lib/SubmitCode.js lib/SubmitCode.ts
git mv lib/judges/Config.js lib/judges/Config.ts
```

**Key types for `lib/Test.ts`:**
```typescript
export function SetCpp(golden: string, test: string): void;
export function SetCppFlags(flags: string): void;
export function SetTimeout(toMs: number): void;
export function Test(): void;
export function __initializeIterator(name: string, min: number, max: number): void;
export function NextCase(p?: unknown): boolean;
export function ListInputFiles(dirName: string): string[];
export function ListSomeFiles(dirName: string, glob: string): string[]): string[];
export function TestSol(fileName: string): void;
```

**Key types for `lib/SubmitCode.ts`:**
```typescript
export interface SubmitOptions {
  openBrowser?: boolean;
}
export async function SubmitCode(filePath: string, options?: SubmitOptions): Promise<boolean>;
```

#### Batch 1.3: Judge implementations (Medium)
```bash
git mv lib/judges/ArenaJudge.js lib/judges/ArenaJudge.ts
git mv lib/judges/PeshoJudge.js lib/judges/PeshoJudge.ts
git mv lib/judges/CSESJudge.js lib/judges/CSESJudge.ts
git mv lib/judges/LibraryCJudge.js lib/judges/LibraryCJudge.ts
```

**Key types for judges:**
```typescript
// lib/judges/BaseJudge.ts
export interface JudgeConfig {
  origin: string;
  submitUrl: string;
  submissionUrl: string;
  languages?: Record<string, string>;
  loginUrl?: string;
  baseUrl?: string;
}

export interface ProblemId {
  [key: string]: string;
}

export interface SubmissionResponse {
  data?: string;
  body?: string;
  headers: Record<string, string | string[]>;
  status: number;
  cookies?: Record<string, string>;
}

export interface AuthCredentials {
  token?: string;
  username?: string;
  password?: string;
  php?: string;
  [key: string]: string | undefined;
}

export abstract class Judge {
  name: string;
  config: JudgeConfig;
  
  constructor(name: string, config: JudgeConfig);
  abstract detect(url: string): boolean;
  abstract parseURL(url: string): ProblemId;
  abstract submit(code: string, problemId: ProblemId, credentials: AuthCredentials): Promise<SubmissionResponse>;
  abstract extractId(response: SubmissionResponse | string): string | null;
  abstract getSubmissionUrl(submissionId: string, problemId?: ProblemId): string;
  abstract isUsingBearerToken(): boolean;
  abstract isAutomatedAuth(): boolean;
  authenticateInteractive?(): Promise<AuthCredentials>;
  reloadAuth?(credentials: AuthCredentials): Promise<AuthCredentials>;
}
```

#### Batch 1.4: Core entry points (Medium-High risk)
```bash
git mv lib/export.js lib/export.ts
git mv lib/loader.js lib/loader.ts
git mv lib/cpp-deps-loader.js lib/cpp-deps-loader.ts
git mv utils/Commands.js utils/Commands.ts
git mv Codetest.js Codetest.ts
```

**Key types for `Codetest.ts`:**
```typescript
interface TestScriptConfig {
  cppFiles: string[];
  CFG: Record<string, unknown>;
  [key: string]: unknown;
}

export async function runTest(): Promise<number>;
```

**Key types for `utils/Commands.ts`:**
```typescript
interface CommandHandler {
  handler: (args: string[], filename: string, watchFiles: string[], testGenFile: string) => Promise<void> | void;
  description?: string;
}

export function registerCommand(name: string, handler: CommandHandler['handler'], description?: string): void;
export async function executeCommand(
  commandStr: string,
  filename: string,
  watchFiles: string[],
  testGenFile: string
): Promise<void>;
export function Setup(testScriptPath: string, argv: string[], config: TestScriptConfig): void;
```

**Key types for `lib/judges/Config.ts`:**
```typescript
export class Config {
  data: {
    judges: Record<string, AuthCredentials>;
    lastFile: string | null;
  };
  
  ensureDir(): void;
  load(): typeof this.data;
  save(): void;
  getJudgeCredentials(judgeName: string): AuthCredentials;
  setJudgeCredentials(judgeName: string, credentials: AuthCredentials): void;
  getLastFile(): string | null;
  setLastFile(file: string): void;
}

export const config: Config;
```

---

### Phase 2: Type annotations and declaration work

After renaming, run type checking and add missing types:

```bash
npm run typecheck
```

**Expected issues and fixes:**

1. **Missing types for `random-seedable`**: Create `types/random-seedable.d.ts`
   ```typescript
   declare module 'random-seedable' {
     interface Random {
       seed(seed: number): void;
       randRange(min: number, max: number): number;
     }
     const random: Random;
     export default random;
   }
   ```

2. **Global modifications in `lib/export.ts`**: Use module augmentation or declare global
   ```typescript
   declare global {
     var N: number | undefined;
     var M: number | undefined;
     // Add other dynamic globals as needed
   }
   
   export function __initialize(globalObject: typeof globalThis): void;
   ```

3. **HTTP response types in judges**: Create shared types
   ```typescript
   // lib/judges/types.ts
   export interface HTTPSResponse {
     body: string;
     status: number;
     headers: Record<string, string | string[]>;
   }
   ```

---

### Phase 3: Update loaders for `.ts` extensions

Update import statements in loader files to reference `.ts` files:

**`lib/loader.ts`** and **`lib/cpp-deps-loader.ts`**:
- Change `import * as globals from './export.js'` to `import * as globals from './export.ts'`
- Or keep `.js` extensions (TypeScript with `moduleResolution: NodeNext` handles this)

---

### Phase 4: Tightening rules

After all files are converted and type-checking passes:

1. Enable `noImplicitAny`:
   ```json
   "compilerOptions": {
     "noImplicitAny": true
   }
   ```

2. Fix any-related errors

3. Enable `strictNullChecks`:
   ```json
   "compilerOptions": {
     "strictNullChecks": true
   }
   ```

4. Fix null/undefined handling

5. Enable full `strict` mode:
   ```json
   "compilerOptions": {
     "strict": true
   }
   ```

---

### Phase 5: Final verification & cleanup

1. **Run type checking:**
   ```bash
   npm run typecheck
   ```

2. **Run existing tests:**
   ```bash
   npm test
   ```

3. **Manual smoke tests:**
   ```bash
   # Test CLI help
   node --import ./lib/loader.js Codetest.ts --help
   
   # Test with example (if available)
   node --import ./lib/loader.js Codetest.ts examples/d/testGen.ts
   ```

4. **Audit for `any` types:**
   ```bash
   # Search for remaining any types
   grep -r ": any" lib/ utils/
   ```

5. **Update CI configuration** (see next section)

6. **Update package.json bin entry:**
   ```json
   "bin": {
     "codetest": "Codetest.ts"
   }
   ```

---

## CI and GitHub Actions Update

Update `.github/workflows/npm-publish.yml`:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run typecheck  # Add TypeScript checking
      - run: npm test
```

---

## No-Enum Policy (Repository-Specific)

This codebase doesn't currently use enums, but for future reference:

**Instead of:**
```typescript
enum JudgeType {
  Arena = 'arena',
  Pesho = 'pesho',
  CSES = 'cses',
  LibraryC = 'libraryc'
}
```

**Use:**
```typescript
// Option 1: String literal union
type JudgeType = 'arena' | 'pesho' | 'cses' | 'libraryc';

// Option 2: as const object
const JUDGE_TYPE = {
  ARENA: 'arena',
  PESH: 'pesho',
  CSES: 'cses',
  LIBRARYC: 'libraryc'
} as const;
type JudgeType = typeof JUDGE_TYPE[keyof typeof JUDGE_TYPE];

// Option 3: Record for mappings
const JUDGE_LABELS: Record<JudgeType, string> = {
  arena: 'Arena Judge',
  pesho: 'Pesho Judge',
  cses: 'CSES Judge',
  libraryc: 'Library C Judge'
};
```

---

## Verification Plan (Repository-Specific)

### Automated tests
```bash
# Type checking
npm run typecheck

# Run existing test suite (currently: exit 0)
npm test
```

### Manual smoke tests

1. **CLI Help:**
   ```bash
   node --import ./lib/loader.js Codetest.ts --help
   ```

2. **Auth flow (if credentials available):**
   ```bash
   node --import ./lib/loader.js Codetest.ts --auth arena
   ```

3. **Example test generation:**
   ```bash
   # If you have the C++ files
   node --import ./lib/loader.js Codetest.ts examples/d/testGen.ts
   ```

4. **Watch mode:**
   ```bash
   node --import ./lib/loader.js Codetest.ts examples/d/testGen.ts --watch
   ```

### Type coverage audit (optional)

```bash
npm install --save-dev type-coverage
```

Add to `package.json`:
```json
"scripts": {
  "type-coverage": "type-coverage --detail"
}
```

Run:
```bash
npm run type-coverage
```

---

## Rollback & Safety

### Migration branch strategy
```bash
# Create migration branch
git checkout -b ts-migration

# Commit 1: Setup
git add tsconfig.json package.json TSTasks.md
git commit -m "chore: Add TypeScript configuration and migration plan"

# Commit 2: Easy files (Batch 1.1)
git mv lib/Random.js lib/Random.ts
# ... other easy files
git commit -m "refactor: Convert utility files to TypeScript"

# Commit 3: Test framework (Batch 1.2)
git mv lib/Test.js lib/Test.ts
# ... other test files
git commit -m "refactor: Convert test framework to TypeScript"

# Continue with subsequent batches...
```

### Rollback procedure
If issues arise:
```bash
# Revert to last good commit
git checkout main

# Or on migration branch, revert specific commits
git revert <commit-hash>
```

---

## Performance Considerations

### Runtime overhead
- Using TypeScript directly with Node.js requires a loader (`--import`)
- Current setup uses `lib/loader.js` which will need to load TypeScript
- Consider `ts-node/esm` or `tsx` for development:
  ```bash
  npm install --save-dev tsx
  ```
  ```json
  "scripts": {
    "dev": "tsx Codetest.ts"
  }
  ```

### Production deployment
For production, consider:
1. Keep current approach (TS runtime) for development
2. Optionally compile to JS for releases:
   ```json
   "scripts": {
     "build": "tsc --emitDeclarationOnly --declaration --outDir dist"
   }
   ```

---

## Edge Cases & Tricky Conversions

### 1. Dynamic imports (judges with readline)
```typescript
// Current JS
const readline = await import("readline");

// TypeScript (same, but add type)
const readline = await import("readline");
// readline has types in @types/node
```

### 2. Global modifications (`lib/export.ts`)
```typescript
// Use declare global for runtime-added properties
declare global {
  var N: number | undefined;
  var M: number | undefined;
}

// Or use a typed config object instead of globals
interface TestConfig {
  N?: number;
  M?: number;
}
const config: TestConfig = {};
```

### 3. HTTP responses in judges
```typescript
// Use type guards for runtime validation
function isSubmissionResponse(response: unknown): response is SubmissionResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response
  );
}
```

### 4. File I/O with dynamic paths
```typescript
// Use path.resolve and proper typing
import { join, resolve } from 'path';
const configPath = resolve(process.cwd(), '.config', 'codetest');
```

---

## Migration Checklist

- [ ] **Phase 0: Setup**
  - [ ] Create `ts-migration` branch
  - [ ] Install dev dependencies
  - [ ] Create `tsconfig.json`
  - [ ] Update `package.json` scripts
  - [ ] Commit setup changes

- [ ] **Phase 1: File renaming**
  - [ ] Batch 1.1: Easy utility files
  - [ ] Batch 1.2: Test framework
  - [ ] Batch 1.3: Judge implementations
  - [ ] Batch 1.4: Core entry points
  - [ ] Run `npm run typecheck` after each batch

- [ ] **Phase 2: Type annotations**
  - [ ] Add types for `random-seedable`
  - [ ] Add types for global modifications
  - [ ] Add shared types for judges
  - [ ] Fix all type errors

- [ ] **Phase 3: Loader updates**
  - [ ] Update `lib/loader.ts`
  - [ ] Update `lib/cpp-deps-loader.ts`
  - [ ] Verify imports work

- [ ] **Phase 4: Strict mode**
  - [ ] Enable `noImplicitAny`
  - [ ] Enable `strictNullChecks`
  - [ ] Enable `strict`
  - [ ] Fix all resulting errors

- [ ] **Phase 5: Verification**
  - [ ] Run `npm run typecheck` (clean)
  - [ ] Run `npm test`
  - [ ] Manual smoke tests
  - [ ] Update CI configuration
  - [ ] Update `package.json` bin entry
  - [ ] Audit for `any` types

- [ ] **Merge**
  - [ ] Create PR
  - [ ] Code review
  - [ ] Merge to main

---

## Estimated Timeline

**Small repository (26 files):** 1-2 days

| Phase | Estimated Time |
|-------|---------------|
| Phase 0: Setup | 30 minutes |
| Phase 1: File renaming | 2-3 hours |
| Phase 2: Type annotations | 4-6 hours |
| Phase 3: Loader updates | 1 hour |
| Phase 4: Strict mode | 2-4 hours |
| Phase 5: Verification | 1-2 hours |

---

## Deliverables

- [x] `TSTasks.md` (this plan)
- [ ] `tsconfig.json` (initial configuration)
- [ ] Updated `package.json` with scripts and devDependencies
- [ ] Updated CI workflow with typecheck step
- [ ] Migrated TypeScript source files (`.ts`)
- [ ] Type declaration files for untyped dependencies

---

## Notes & Recommendations

1. **Keep `.js` extensions in imports**: With `moduleResolution: NodeNext`, TypeScript understands `.js` extensions pointing to `.ts` files

2. **Use `import type` for type-only imports**:
   ```typescript
   import type { JudgeConfig, AuthCredentials } from './BaseJudge.js';
   ```

3. **No enums**: Enforce via code review or add ESLint rule:
   ```json
   "@typescript-eslint/no-enum": "error"
   ```

4. **Incremental migration**: Keep `allowJs: true` until all files are converted

5. **Commit frequently**: Small, revertible commits make rollback easier

6. **Test after each batch**: Don't batch all renames before testing

---

## Contact Points During Migration

For this repository, designate reviewers for:
- **CLI/Core**: Review `Codetest.ts`, `utils/Commands.ts`
- **Judge System**: Review `lib/judges/*.ts` files
- **Test Framework**: Review `lib/Test.ts`, `lib/Generate.ts`

Keep communication open during migration via PR comments.
