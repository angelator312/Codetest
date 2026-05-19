import { config } from "./judges/Config.ts";
import { CodeParse } from "./judges/CodeParser.ts";
import { exec } from "child_process";
import type { SubmissionResponse } from "./judges/BaseJudge.ts";
import { IsThereACerr } from "./SearchForCerr.ts";

interface SubmitOptions {
  openBrowser?: boolean;
}

const defaultOptions: Required<SubmitOptions> = { openBrowser: true };

export async function SubmitCode(
  filePath: string,
  options: SubmitOptions = {},
): Promise<boolean> {
  // returning true on no problems, false - if there some problems
  const opts = { ...defaultOptions, ...options };
  console.log(`\n📤 Submitting ${filePath}...`);
  try {
    // Parse file
    const { judge, problemId, code } = CodeParse(filePath);
    console.log(`   Judge: ${judge.name}`);

    // Get credentials
    const credentials = config.getJudgeCredentials(judge.name);
    if (!credentials || Object.keys(credentials).length === 0) {
      console.error(`❌ No credentials found for ${judge.name}`);
      console.log(`   Run: codetest --auth ${judge.name.toLowerCase()}`);
      return false;
    }
    if (IsThereACerr(code)) {
      console.error("There's a cerr in the code.");
      return;
    }
    // Submit
    let response = await judge.submit(code, problemId, credentials);

    // Check if response is an HTTP response with status
    const hasStatus =
      typeof response === "object" && response !== null && "status" in response;
    const status = hasStatus ? (response as SubmissionResponse).status : 0;

    if (
      (status === 403 || status === 401) &&
      typeof judge.reloadAuth === "function"
    ) {
      const cred = await judge.reloadAuth(
        config.getJudgeCredentials(judge.name),
      );
      console.log("Reloaded Auth");
      config.setJudgeCredentials(judge.name, cred);
      response = await judge.submit(code, problemId, cred);
    }
    const id = judge.extractId(response);

    if (!id) {
      console.error("❌ Failed to extract submission ID");
      console.log("   Response:", response);
      return false;
    }

    // Open browser
    const url = judge.getSubmissionUrl(id, problemId);
    if (opts.openBrowser) OpenURLInBrowser(url);
    return true;
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
    return false;
  }
}

function OpenURLInBrowser(url: string): void {
  console.log(`Opening ${url}`);
  const platform = process.platform;
  let command: string;

  if (platform === "linux") {
    command = "xdg-open";
  } else if (platform === "darwin") {
    command = "open";
  } else if (platform === "win32") {
    command = "start";
  } else {
    console.log("Can't open browser in this OS.");
    return;
  }

  exec(`${command} "${url}"`, (err) => {
    if (err) console.error("Error opening browser:", err.message);
  });
}
