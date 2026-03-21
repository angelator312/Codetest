import fs from "fs";
import { Failure } from "./utils.ts";

let currentOutput: number | null = null;
let outputFileName: string | undefined;
let lineSeparator = "\n";
let itemSeparator = " ";
let currentLine: string[] = [];

export function SetOutput(fileName: string): void {
  currentOutput = fs.openSync(fileName, "w");
  outputFileName = fileName;
}

export function GetOutput(): string | undefined {
  return outputFileName;
}

export function CloseOutput(): void {
  if (currentOutput !== null) {
    fs.closeSync(currentOutput);
    currentOutput = null;
  }
}

export function SaveOutputAs(suffix: string): void {
  if (outputFileName) {
    fs.mkdirSync(outputFileName + ".saved", { recursive: true });
    fs.renameSync(
      outputFileName,
      `${outputFileName}.saved/${outputFileName}-${suffix}`,
    );
  }
}

export function SetItemSeparator(sep: string): void {
  itemSeparator = sep;
}

export function Eol(): void {
  if (!currentOutput) {
    Fail("Output not set. Call SetOutput(fileName) first.");
  }
  fs.writeSync(currentOutput, currentLine.join(itemSeparator) + lineSeparator);
  currentLine = [];
}

export function Out(s: string): void {
  currentLine.push(s);
}

export function Log(...s: unknown[]): void {
  console.log("LOG:", ...s);
}

export function Fail(msg: string): never {
  throw new Failure(msg);
}
