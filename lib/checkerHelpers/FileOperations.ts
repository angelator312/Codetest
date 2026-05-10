import { readFileSync } from "fs";
export function GetFileAs2DArrayOfNumbers(file: string): number[][] {
  const f = readFileSync(file, "utf8");
  return f.split("\n").map((e) => e.split(" ")).map((e) => e.map((e) => parseInt(e)));
}
export function GetFileAsArrayOfNumbers(file: string): number[] {
  const f = readFileSync(file, "utf8");
  return f.split("\n").flatMap((e) => e.split(" ")).map((e) => parseInt(e));
}
