import { execSync } from "node:child_process";
import type { ExecSyncOptions } from "node:child_process";

import fs from "node:fs";
import os from 'node:os';
import chalk from 'chalk';

export function formatNanoseconds(nanos: bigint): string {
  if (typeof nanos !== 'bigint') {
    throw new TypeError('Input must be a BigInt');
  }

  if (nanos === 0n) return '0 ns';

  const sign = nanos < 0n ? '-' : '';
  nanos = nanos < 0n ? -nanos : nanos;

  const scales = [
    { threshold: 86400000000000n, unit: 'd',  divisor: 86400000000000n },
    { threshold: 3600000000000n,  unit: 'h',  divisor: 3600000000000n  },
    { threshold: 60000000000n,    unit: 'm',  divisor: 60000000000n    },
    { threshold: 1000000000n,     unit: 's',  divisor: 1000000000n     },
    { threshold: 1000000n,        unit: 'ms', divisor: 1000000n        },
    { threshold: 1000n,           unit: 'µs', divisor: 1000n           },
    { threshold: 0n,              unit: 'ns', divisor: 1n              }
  ];

  for (const { threshold, unit, divisor } of scales) {
    if (nanos >= threshold) {
      const value = Number(nanos) / Number(divisor);
      // Format to max 3 decimal places, remove trailing zeros
      const formatted = value.toLocaleString('en', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      });
      return `${sign}${formatted} ${unit}`;
    }
  }

  return `${sign}${nanos} ns`; // fallback
}

interface ExecSyncError extends Error {
  signal?: string;
  status?: number;
}

export function runCommand(
  cmd: string,
  stdInPath: string,
  stdOutPath: string,
  timeout: number,
  stdErrPath?: string | null,
  OnError?: () =>void|null
): void {
  // Open input and output files
  const input = fs.openSync(stdInPath, 'r');
  const output = fs.openSync(stdOutPath, 'w');
  const err = stdErrPath ? fs.openSync(stdErrPath, 'w') : "inherit";

  try {
    execSync(cmd, {
      stdio: [
        input,    // stdin: read from input.txt
        output,   // stdout: write to output.txt
        err       // stderr: inherit or file
      ],
      timeout,
    } as ExecSyncOptions);
  } catch (e) {
    const error = e as ExecSyncError;
    if (error.signal) {
      if(OnError)OnError();
      const description = getSignalDescription(error);
      if (description) {
        console.error(chalk.red(description));
      }
    }
    throw new CommandFailure(`'${cmd}' failed.`, error);
  } finally {
    fs.closeSync(input);
    fs.closeSync(output);
    if (err !== "inherit") fs.closeSync(err);
  }
}

function getSignalDescription(error: ExecSyncError): string | null {
  // Check if the error has a 'signal' property (set by child_process when killed by signal)
  if (!error || typeof error !== 'object' || !error.signal) {
    return null;
  }

  const signal = error.signal;

  // Validate it's a known signal
  if (!os.constants.signals[signal as keyof typeof os.constants.signals]) {
    return `Terminated by unknown signal: ${signal}`;
  }

  // Map common signals to user-friendly messages
  const descriptions: Record<string, string> = {
    SIGINT: 'Interrupted (Ctrl+C or similar)',
    SIGTERM: 'Terminated gracefully',
    SIGKILL: 'Forcibly killed',
    SIGHUP: 'Hangup detected (e.g., terminal closed)',
    SIGQUIT: 'Quit request (often Ctrl+\\)',
    SIGABRT: 'Aborted (program called abort())',
    SIGFPE: 'Floating-point exception (e.g., division by zero)',
    SIGSEGV: 'Segmentation fault (invalid memory access)',
    SIGPIPE: 'Broken pipe (writing to a closed pipe/socket)',
    SIGALRM: 'Alarm clock (timer expired)',
    SIGUSR1: 'User-defined signal 1',
    SIGUSR2: 'User-defined signal 2',
    SIGCHLD: 'Child process stopped or terminated',
    SIGSTOP: 'Stopped (cannot be caught or ignored)',
    SIGTSTP: 'Stopped by terminal (e.g., Ctrl+Z)',
    SIGCONT: 'Continued after stop',
  };

  return descriptions[signal]
    ? `${descriptions[signal]} (${signal})`
    : `Terminated by signal: ${signal}`;
}

export class CommandFailure extends Error {
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "CommandFailure";
    this.cause = cause;
  }
}

export class Failure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Failure";
  }
}
