import chalk from "chalk";
import readline from "readline";
import { SubmitCode } from "./SubmitCode.js";
const sendShortcut = "f";
export function Setup(testScriptPath, argv, config) {
  if (config.cppFiles.length == 0) {
    console.error(chalk.red("No CPP files!\n"));
    process.exit(1);
  }
  let filename = config.cppFiles[0];
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  process.stdin.on("keypress", async (str, key) => {
    if (key.ctrl && key.name === "g") {
      console.log(chalk.green("Commands in terminal:"));
      console.log(chalk.red("ctrl-c - exiting the program"));
      console.log(chalk.blue(`ctrl-${sendShortcut} - online judge`));
      console.log(chalk.cyan(`ctrl-l - Clearing the console`));
      console.log(chalk.gray(`ctrl-g - Help`));
    } else if (key.ctrl && key.name === "c") {
      console.log(chalk.red("Stopping gracefully."));
      process.exit();
    } else if (key.ctrl && key.name === sendShortcut) {
      console.log(chalk.cyan("Sending "));
      await SubmitCode(filename);
    } else if (key.ctrl && key.name === "l") {
      console.clear();
      console.log(chalk.blue("Code Test "));
      const watchFiles = [testScriptPath, ...config.cppFiles];
      console.log(`>>> Watching for file changes to re-run ${watchFiles}...`);
    }
  });
}
