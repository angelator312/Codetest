import { readFileSync } from "fs";
export function GetFileAs2DArrayOfNumbers(file: string): number[][] {
  const f = readFileSync(file, "utf8");
  return f
    .split("\n")
    .map((e) => e.split(" ").filter((e) => e.length))
    .map((e) => e.map((e2) => parseInt(e2, 10)));
}
export function GetFileAsArrayOfNumbers(file: string): number[] {
  const f = readFileSync(file, "utf8");
  return f
    .split("\n")
    .flatMap((e) => e.split(" "))
    .map((e2) => parseInt(e2, 10));

}
type OptionalSequence =
  | {
      is_ok: 1;
      sequence: number[];
    }
  | { is_ok: 0 };
export function GetFileAsArrayOfOptionalSequences(
  file: string,
): OptionalSequence[] {
  const f = readFileSync(file, "utf8");
  const lines = f.split("\n");
  let sequences: string[] = [];
  let optSeqs: OptionalSequence[] = [];
  for (let i = 0; i < lines.length; ++i) {
    if (lines[i].trim().toLowerCase() == "yes") {
      optSeqs.push({
        is_ok: 1,
        sequence: lines[++i].split(" ").map((e) => parseInt(e, 10)),
      });
    } else {
      optSeqs.push({ is_ok: 0 });
    }
  }
  return optSeqs;
}
type TestCaseLines = string[];
interface SimpleTestCase {
  n: number;
  line: string;
}
export function GetFileAsArrayOfSimpleTestCases(file: string) {
  const lines: string[] = readFileSync(file, "utf8").split(
    "\n",
  ); /* edin element edin red ot faila */
  const [specialen, ...groups] = lines;
  let groupLines = groups;
  const out:SimpleTestCase[] = [];
  while (groupLines.length) {
    const [red1, red2, ...rest] = groupLines;
    out.push({n:parseInt(red1,10), line:red2});
    groupLines = rest;
  }
  // console.log(out);
  return out;
}
