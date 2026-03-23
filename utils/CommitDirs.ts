import { execSync } from "child_process";
import fs from "node:fs";

/**
 * Commit .cpp file + matching .d directory to Git
 * @param cppFile - e.g., "someFile.cpp"
 * @param points - Points to include in commit message (default: 100)
 * @throws Error on validation/execution failures
 */
export function CommitCppWithDir(
  cppFile: string,
  points: number | string | number[] = 100,
): void {
  // Validate file exists
  if (!fs.existsSync(cppFile)) {
    throw new Error(`File not found: ${cppFile}`);
  }

  // Derive .d directory name dynamically: someFile.cpp → someFile.d
  const dirName = cppFile.replace(/\.cpp$/i, ".d");
  CommitFiles([cppFile, dirName], cppFile, points);
}
export function CommitFiles(
  files: string[],
  fileInCommitMsg: string,
  points: number | string | number[] | string[] = 100,
): void {
  // Verify Git repo
  try {
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
  } catch {
    throw new Error("Not in a Git repository");
  }

  // Stage files (shell-safe array syntax)
  execSync(["git", "add", ...files].join(" "), { stdio: "inherit" });

  // Check for staged changes (SAFE: doesn't throw on non-zero exit)
  // git diff --cached --name-only exits 0 even when changes exist
  const stagedFiles = execSync("git diff --cached --name-only", {
    encoding: "utf8",
  }).trim();

  // Build commit message
  const commitMsg = getCommitMsg(fileInCommitMsg, points);

  // Commit (shell-safe array syntax)
  console.log(`\n✓ Committing: "${commitMsg}"`);
  execSync(["git", "commit", "-m", `'` + commitMsg + `'`].join(" "), {
    stdio: "inherit",
  });
  console.log("\n✅ Successfully committed changes");
  if (stagedFiles === "") {
    console.log("\n No changes to commit (all files already committed)");
    return;
  }
}
/*
Generates commit msg
*/
export function getCommitMsg(
  cppFile: string,
  points: number | string | number[] | string[] = 100,
) {
  let pointsSuffix: string;
  if (Array.isArray(points)) {
    pointsSuffix = points.join(" ");
  } else if (typeof points === "number") {
    pointsSuffix = `${points} points`;
  } else {
    pointsSuffix = isNaN(parseInt(points, 10)) ? points : `${points} points`;
  }
  return `Add ${cppFile} (${pointsSuffix})`;
}
