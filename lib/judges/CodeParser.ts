import fs from "fs";
import { judges } from "./JudgeRegistry.ts";
import { Judge } from "./BaseJudge.ts";
import type {ProblemId } from "./BaseJudge.ts";

export interface CodeParseResult {
  judge: Judge;
  problemId: ProblemId;
  code: string;
  url: string;
}

export function CodeParse(filePath: string): CodeParseResult {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const firstLine = lines[0].trim();
  const code = lines.join("\n");

  // Detect judge from URL in first line
  const urlMatch = firstLine.match(/(https?:\/\/[^\s]+)/);
  if (!urlMatch) {
    throw new Error("No URL found in first line of file");
  }

  const url = urlMatch[1];
  const judge = judges.detect(url);

  if (!judge) {
    throw new Error(`Unknown judge for URL: ${url}`);
  }

  const problemId = judge.parseURL(url);

  return {
    judge,
    problemId,
    code,
    url,
  };
}
