import { execSync } from "child_process";
import { openSync, readFileSync, readSync, unlinkSync, writeFileSync } from "fs";
const NAME_OF_TMP = "types/tmp.d.ts";
execSync(`./node_modules/.bin/dts-bundle-generator -o ${NAME_OF_TMP} lib/export.ts`,
  { stdio: "inherit" });
const fileContent = readFileSync(NAME_OF_TMP).toString()
const edited = fileContent.replaceAll(/^export\s+declare\s+(?=\w)/gm, "  ").replace("export {};", "");
const PREDEFINED = ["CPP", "DIR"];
let defineAllSmallConstants = "\n";
for (let e of PREDEFINED)defineAllSmallConstants+=defineVar(e);
for (let a = 0; a < 26; ++a)
  defineAllSmallConstants += defineVar(String.fromCharCode(a+65));
const final="export {};\ndeclare global{\n"+edited+defineAllSmallConstants+"\n}"
writeFileSync("types/index.d.ts", final)
execSync(`./node_modules/.bin/prettier -w types/index.d.ts`,
  { stdio: "inherit" });
unlinkSync(NAME_OF_TMP)

function defineVar(s:string){return `  const ${s}:string|number;\n`}
