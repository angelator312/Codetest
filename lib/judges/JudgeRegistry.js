import { ArenaJudge } from "./ArenaJudge.js";
import { PeshoJudge } from "./PeshoJudge.js";
import { LibraryCJudge } from "./LibraryCJudge.js";

class JudgeRegistry {
  constructor() {
    this.judges = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    // Add more
    this.register(new ArenaJudge());
    this.register(new PeshoJudge());
    this.register(new LibraryCJudge());
  }

  register(judge) {
    this.judges.set(judge.name.toLowerCase(), judge);
  }

  detect(url) {
    for (const judge of this.judges.values()) {
      if (judge.detect(url)) {
        return judge;
      }
    }
    return null;
  }

  get(name) {
    return this.judges.get(name.toLowerCase());
  }

  list() {
    return Array.from(this.judges.keys());
  }
}

export const judges = new JudgeRegistry();
