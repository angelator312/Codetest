import { config } from "./judges/Config.js";
import { CodeParse } from "./judges/CodeParser.js";
import { exec } from "child_process";

const defaultOptions = { openBrowser: true };

export async function SubmitCode(filePath, opions) { //returning true on no problems, false - if there some problems
  const options = { ...defaultOptions, ...opions };
  console.log(`\n📤 Submitting ${filePath}...`);
  try {
    // Parse file
    const { judge, problemId, code } = CodeParse(filePath);
    console.log(`   Judge: ${judge.name}`);
    console.log(`   Problem: ${JSON.stringify(problemId)}`);

    // Get credentials
    const credentials = config.getJudgeCredentials(judge.name);
    if (!credentials || Object.keys(credentials).length === 0) {
      console.error(`❌ No credentials found for ${judge.name}`);
      console.log(`   Run: codetest --auth ${judge.name.toLowerCase()}`);
      return false;
    }

    // Submit
    const response = await judge.submit(code, problemId, credentials);
    const id = judge.extractId(response);

    if (!id) {
      console.error("❌ Failed to extract submission ID");
      console.log("   Response:", response);
      return false;
    }

    console.log(`✅ Submitted! ID: ${id}`);

    // Open browser
    const url = judge.getSubmissionUrl(id, problemId);
    console.log(`🌐 Opening ${url}`);
    if (options.openBrowser) OpenURLInBrowser(url);
    return true;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}
function OpenURLInBrowser(url) {
  console.log(`Opening ${url}`);
  const platform = process.platform;
  let command;

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
