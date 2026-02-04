import chalk from "chalk";
import readline from "readline";
import { SubmitCode } from "../lib/SubmitCode.js";
import { CommitCppWithDir } from "./CommitDirs.js";
import { runTest } from "../Codetest.js";

const sendShortcut = "f";

// Command registry to store vim-style commands
const commandRegistry = new Map();

// Register a command with its handler function
export function registerCommand(name, handler, description = "") {
  commandRegistry.set(name, { handler, description });
}

// Execute a command by name with arguments
export async function executeCommand(commandStr, filename, watchFiles,testGenFile) {
  // Parse command and arguments
  const trimmed = commandStr.trim();
  if (!trimmed.startsWith(":")) {
    console.log(chalk.yellow("Commands must start with :"));
    return;
  }

  const parts = trimmed.slice(1).split(/\s+/); // Split by whitespace, but only take first as command
  const commandName = parts[0];
  const args = parts.slice(1);

  if (commandRegistry.has(commandName)) {
    try {
      // Pass filename and watchFiles to handlers that need them
      await commandRegistry
        .get(commandName)
        .handler(args, filename, watchFiles,testGenFile);
    } catch (error) {
      console.error(
        chalk.red(`Error executing command :${commandName}:`, error.message),
      );
    }
  } else {
    console.log(chalk.red(`Unknown command: :${commandName}`));
    console.log(chalk.gray("Type :h for help"));
  }
}

// Initialize default commands
function initializeDefaultCommands() {
  // Help command
  registerCommand(
    "h",
    () => {
      console.log(chalk.green("Vim-style commands:"));
      for (const [name, { description }] of commandRegistry.entries()) {
        console.log(
          chalk.blue(`:${name} - ${description || "No description"}`),
        );
      }
    },
    "Show this help message",
  );

  // Quit command
  registerCommand(
    "q",
    () => {
      console.log(chalk.red("Stopping gracefully."));
      process.exit();
    },
    "Quit the program",
  );

  // Send/submit command
  registerCommand(
    "submit",
    async (args, cmdFilename) => {
      console.log(chalk.cyan("Sending code for evaluation..."));
      // Use the provided filename
      if (cmdFilename) {
        await SubmitCode(cmdFilename);
      } else {
        console.log(chalk.red("No file to submit"));
      }
    },
    "Submit the current file for evaluation",
  );

  registerCommand(
    "p",
    (args, cmdFilename, cmdWatchFiles) => {
      CommitCppWithDir(cmdFilename, args);
    },
    "Pushes changes to git.",
  );
  registerCommand(
    "res",
    (args, cmdFilename, cmdWatchFiles,testGenFile) => {
      runTest(cmdFilename);
    },
    "Runs the JS file",
  );
}
function ClearLastLine() {
  process.stdout.write("\r\x1b[K");
}
export function Setup(testScriptPath, argv, config) {
  if (config.cppFiles.length == 0) {
    console.error(chalk.red("No CPP files!\n"));
    process.exit(1);
  }
  let filename = config.cppFiles[0];
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  initializeDefaultCommands();
  // Buffer to store typed characters for command input
  let commandBuffer = "",
    startCommand = false;
  const watchFiles = [testScriptPath, ...config.cppFiles];

  process.stdin.on("keypress", async (str, key) => {
    if (key.ctrl && key.name === "g") {
      console.log(chalk.green("Commands in terminal:"));
      console.log(chalk.red("ctrl-c - exiting the program"));
      console.log(chalk.blue(`ctrl-${sendShortcut} - online judge`));
      console.log(chalk.cyan(`ctrl-l - Clearing the console`));
      console.log(chalk.gray(`ctrl-g - Help`));
      console.log(chalk.magenta(`:h - Vim-style help`));
      console.log(chalk.magenta(`:q - Quit`));
      process.stdout.write("> "); // Show prompt
    } else if (key.ctrl && key.name === "c") {
      console.log(chalk.red("Stopping gracefully."));
      process.exit();
    } else if (key.ctrl && key.name === sendShortcut) {
      console.log(chalk.cyan("Sending "));
      await SubmitCode(filename);
    } else if (key.ctrl && key.name === "l") {
      console.clear();
      console.log(chalk.blue("Code Test "));
      console.log(`>>> Watching for file changes to re-run ${watchFiles}...`);
    } else if (key.name == "return") {
      console.log();
      if (commandBuffer) executeCommand(commandBuffer, filename, watchFiles,testScriptPath);
      commandBuffer = "";
      startCommand = false;
    } else if (!key.ctrl && startCommand) {
      if (key.name == "backspace") {
        commandBuffer = commandBuffer.slice(0, -1);
        if (commandBuffer.length == 0) startCommand = false;
        ClearLastLine();
        process.stdout.write(commandBuffer);
      } else commandBuffer += key.sequence;
    } else if (!startCommand) {
      if (key.sequence == ":") {
        startCommand = true;
        commandBuffer = ":";
      }
    }
    if (startCommand && key.sequence.length < 2)
      process.stdout.write(key.sequence);
  });
}
