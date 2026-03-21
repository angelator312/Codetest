import fs from "fs";
import path from "path";
import os from "os";
import type { AuthCredentials } from "./BaseJudge.ts";

const CONFIG_DIR = path.join(os.homedir(), ".config", "codetest");

interface ConfigData {
  judges: Record<string, AuthCredentials>;
  lastFile: string | null;
}

export class Config {
  data: ConfigData;

  constructor() {
    this.ensureDir();
    this.data = this.load();
  }

  ensureDir(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  load(): ConfigData {
    try {
      const judges: Record<string, AuthCredentials> = {};

      fs.readdirSync(CONFIG_DIR).forEach((file) => {
        if (file.endsWith(".j.json")) {
          judges[file.replace(".j.json", "")] = JSON.parse(
            fs.readFileSync(path.join(CONFIG_DIR, file), "utf8"),
          );
        }
      });
      // console.log("Loaded judges config");
      return { judges, lastFile: null };
    } catch {
      return { judges: {}, lastFile: null };
    }
  }

  save(): void {
    for (const judgeName in this.data.judges) {
      fs.writeFileSync(
        path.join(CONFIG_DIR, judgeName + ".j.json"),
        JSON.stringify(this.data.judges[judgeName], null, 2),
      );
    }
  }

  getJudgeCredentials(judgeName: string): AuthCredentials {
    return this.data.judges[judgeName.toLowerCase()] || {};
  }

  setJudgeCredentials(judgeName: string, credentials: AuthCredentials): void {
    this.data.judges[judgeName.toLowerCase()] = {
      ...(this.data.judges[judgeName.toLowerCase()] ?? {}),
      ...credentials,
    };
    this.save();
  }

  getLastFile(): string | null {
    return this.data.lastFile;
  }

  setLastFile(file: string): void {
    this.data.lastFile = path.resolve(file);
    this.save();
  }
}

export const config = new Config();
