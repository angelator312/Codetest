import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".config", "codetest");

export class Config {
  constructor() {
    this.ensureDir();
    this.data = this.load();
  }

  ensureDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  load() {
    try {
      let judges = {};

      fs.readdirSync(CONFIG_DIR).forEach((file) => {
        if (file.endsWith(".j.json")) {
          judges[file.replace(".j.json", "")] = JSON.parse(
            fs.readFileSync(path.join(CONFIG_DIR, file)),
          );
        }
      });
      // console.log("Loaded judges config");
      return { judges, lastFile: null };
    } catch {
      return { judges: {}, lastFile: null };
    }
  }

  save() {
    for (const judgeName in this.data.judges)
      fs.writeFileSync(
        path.join(CONFIG_DIR, judgeName+".j.json"),
        JSON.stringify(this.data.judges[judgeName], null, 2),
      );
  }

  getJudgeCredentials(judgeName) {
    return this.data.judges[judgeName.toLowerCase()] || {};
  }

  setJudgeCredentials(judgeName, credentials) {
    this.data.judges[judgeName.toLowerCase()] = credentials;
    this.save();
  }

  getLastFile() {
    return this.data.lastFile;
  }

  setLastFile(file) {
    this.data.lastFile = path.resolve(file);
    this.save();
  }
}

export const config = new Config();
