import { ArenaJudge } from "./ArenaJudge.ts";
import { PeshoJudge } from "./PeshoJudge.ts";
import { LibraryCJudge } from "./LibraryCJudge.ts";
import { CSESJudge } from "./CSESJudge.ts";
import { CertJudge } from "./CertJudge.ts";
import { Judge } from "./BaseJudge.ts";

class JudgeRegistry {
  judges: Map<string, Judge>;

  constructor() {
    this.judges = new Map();
    this.registerDefaults();
  }

  registerDefaults(): void {
    // Add more
    this.register(new ArenaJudge());
    this.register(new PeshoJudge());
    this.register(new LibraryCJudge());
    this.register(new CSESJudge());
    this.register(new CertJudge());
  }

  register(judge: Judge): void {
    this.judges.set(judge.name.toLowerCase(), judge);
  }

  detect(url: string): Judge | null {
    for (const judge of this.judges.values()) {
      if (judge.detect(url)) {
        return judge;
      }
    }
    return null;
  }

  get(name: string): Judge | undefined {
    return this.judges.get(name.toLowerCase());
  }

  list(): string[] {
    return Array.from(this.judges.keys());
  }
}

export const judges = new JudgeRegistry();
