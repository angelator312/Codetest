import chalk from "chalk";
import readline from "readline";
import { SubmitCode } from "../lib/SubmitCode.ts";
import { CommitCppWithDir, CommitFiles } from "./CommitDirs.ts";
import { runTest } from "../Codetest.ts";
import { join } from "path";

const sendShortcut = "f";

interface CommandHandler {
  handler: (
    args: string[],
    filename: string,
    watchFiles: string[],
    testGenFile: string,
  ) => Promise<void> | void;
  description?: string;
  shortcut?: string;
}

// Command registry to store vim-style commands
const commandRegistry = new Map<string, CommandHandler>();

// Shortcut registry: maps key name to command name
const shortcutRegistry = new Map<string, string>();

// Register a command with its handler function and optional shortcut
export function registerCommand(
  name: string,
  handler: CommandHandler["handler"],
  description = "",
  shortcut?: string,
): void {
  commandRegistry.set(name, { handler, description, shortcut });
  if (shortcut) {
    shortcutRegistry.set(shortcut, name);
  }
}

// Execute a shortcut command by key name
export async function executeShortcut(
  keyName: string,
  filename: string,
  watchFiles: string[],
  testGenFile: string,
): Promise<void> {
  const commandName = shortcutRegistry.get(keyName);
  if (commandName) {
    const command = commandRegistry.get(commandName);
    if (command) {
      await command.handler([], filename, watchFiles, testGenFile);
    }
  }
}

// Execute a command by name with arguments
export async function executeCommand(
  commandStr: string,
  filename: string,
  watchFiles: string[],
  testGenFile: string,
): Promise<void> {
  // Parse command and arguments
  const trimmed = commandStr.trim();
  if (!trimmed.startsWith(":")) {
    console.log(chalk.yellow("Commands must start with :"));
    return;
  }

  const parts = trimmed.slice(1).split(/\s+/); // Split by whitespace, but only take first as command
  const commandName = parts[0];
  const args = parts.slice(1);

  const command = commandRegistry.get(commandName);
  if (command) {
    try {
      // Pass filename and watchFiles to handlers that need them
      await command.handler(args, filename, watchFiles, testGenFile);
    } catch (error) {
      const err = error as Error;
      console.error(
        chalk.red(`Error executing command :${commandName}:`, err.message),
      );
    }
  } else {
    console.log(chalk.red(`Unknown command: :${commandName}`));
    console.log(chalk.gray("Type :h for help"));
  }
}

// Initialize default commands
function initializeDefaultCommands(): void {
  // Help command
  registerCommand(
    "h",
    () => {
      console.log(chalk.green("Vim-style commands:"));
      for (const [
        name,
        { description, shortcut },
      ] of commandRegistry.entries()) {
        const shortcutStr = shortcut ? chalk.gray(` (Ctrl-${shortcut})`) : "";
        console.log(
          chalk.blue(
            `:${name}${shortcutStr} - ${description || "No description"}`,
          ),
        );
      }
    },
    "Show this help message",
    "g",
  );
  // Quit command
  registerCommand(
    "q",
    () => {
      console.log(chalk.red("Stopping gracefully."));
      process.exit();
    },
    "Quit the program",
    "c",
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
    sendShortcut,
  );
  // Commit dirs command
  registerCommand(
    "p",
    (args, cmdFilename, watchFiles2) => {
      const pointsArg = args.length === 1 ? args[0] : args;
      // CommitCppWithDir accepts number | string | number[]
      //
      const watchFiles = watchFiles2.filter(
        (e) => !e.startsWith(join(import.meta.dirname, "..", "stdTest")),
      );
      CommitFiles(watchFiles, cmdFilename, pointsArg);
    },
    "Pushes changes to git.",
  );
  // Run JS file again command
  registerCommand(
    "res",
    () => {
      runTest();
    },
    "Runs the JS file",
  );
  // Clear console command
  registerCommand(
    "clear",
    (args, filename) => {
      console.clear();
      console.log(chalk.blue("Code Test " + filename));
    },
    "Clear the console",
    "l",
  );
}

function ClearLastLine(): void {
  process.stdout.write("\r\x1b[K");
}

interface TestScriptConfig {
  cppFiles: string[];
  CFG: Record<string, unknown>;
  [key: string]: unknown;
}

export function Setup(
  testScriptPath: string,
  argv: string[],
  config: TestScriptConfig,
): void {
  if (config.cppFiles.length === 0) {
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
    if (key.ctrl && key.name) {
      await executeShortcut(key.name, filename, watchFiles, testScriptPath);
    }

    if (key.name === "return") {
      console.log();
      if (commandBuffer)
        executeCommand(commandBuffer, filename, watchFiles, testScriptPath);
      commandBuffer = "";
      startCommand = false;
    } else if (!key.ctrl && startCommand) {
      if (key.name === "backspace") {
        commandBuffer = commandBuffer.slice(0, -1);
        if (commandBuffer.length === 0) startCommand = false;
        ClearLastLine();
        process.stdout.write(commandBuffer);
      } else commandBuffer += key.sequence ?? "";
    } else if (!startCommand) {
      if (key.sequence === ":") {
        startCommand = true;
        commandBuffer = ":";
      }
    }
    if (startCommand && (key.sequence?.length ?? 0) < 2)
      process.stdout.write(key.sequence ?? "");
  });
}
