import fs from "fs";
import { Failure } from "./utils.js";

let currentOutput;
let outputFileName;
let lineSeparator = "\n";
let itemSeparator = " ";
let currentLine = [];

export function SetOutput(fileName) {
  currentOutput = fs.openSync(fileName, "w");
  outputFileName = fileName;
}

export function GetOutput() {
    return outputFileName;
}

export function CloseOutput() {
  fs.closeSync(currentOutput);
  currentOutput = null;
}

export function SaveOutputAs(suffix) {
  fs.mkdirSync(outputFileName + ".saved", { recursive: true });
  fs.renameSync(
    outputFileName,
    `${outputFileName}.saved/${outputFileName}-${suffix}`,
  );
}

export function SetItemSeparator(sep) {
  itemSeparator = sep;
}

export function Eol() {
  if (!currentOutput) {
    Fail("Output not set. Call SetOutput(fileName) first.");
  }
  fs.writeSync(currentOutput, currentLine.join(itemSeparator) + lineSeparator);
  currentLine = [];
}

export function Out(s) {
    currentLine.push(s);
}

export function Log(s) {
  console.log("LOG:",s)
}

export function Fail(msg) {
  throw new Failure(msg);
}
