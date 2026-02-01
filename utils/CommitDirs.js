import { execSync } from "child_process";
import fs from "node:fs";

/**
 * Commit .cpp file + matching .d directory to Git
 * @param {string} cppFile - e.g., "someFile.cpp"
 * @param {number} points - Points to include in commit message (default: 100)
 * @throws {Error} on validation/execution failures
 */
export function CommitCppWithDir(cppFile, points = 100) {
  // Validate file exists
  if (!fs.existsSync(cppFile)) {
    throw new Error(`File not found: ${cppFile}`);
  }

  // Derive .d directory name dynamically: someFile.cpp → someFile.d
  const dirName = cppFile.replace(/\.cpp$/i, ".d");
  if (!fs.existsSync(dirName) || !fs.statSync(dirName).isDirectory()) {
    throw new Error(`Directory not found: ${dirName}`);
  }

  // Verify Git repo
  try {
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
  } catch {
    throw new Error("Not in a Git repository");
  }

  // Stage files (shell-safe array syntax)
  console.log(`✓ Staging: ${cppFile}`);
  console.log(`✓ Staging: ${dirName}/`);
  execSync(["git", "add", cppFile, dirName].join(" "), { stdio: "inherit" });

  // Check for staged changes (SAFE: doesn't throw on non-zero exit)
  // git diff --cached --name-only exits 0 even when changes exist
  const stagedFiles = execSync("git diff --cached --name-only", {
    encoding: "utf8",
  }).trim();

  if (stagedFiles === "") {
    console.log("\nℹ️ No changes to commit (all files already committed)");
    return;
  }

  // Build commit message
  const pointsSuffix = points === 100 ? "full sol" : `${points} points`;
  const commitMsg = `Add ${cppFile} (${pointsSuffix})`;

  // Commit (shell-safe array syntax)
  console.log(`\n✓ Committing: "${commitMsg}"`);
  execSync(["git", "commit", "-m", `'` + commitMsg + `'`].join(" "), {
    stdio: "inherit",
  });
  console.log("\n✅ Successfully committed changes");
}
