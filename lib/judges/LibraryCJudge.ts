import https from "https";
import type {  ProblemId, AuthCredentials, SubmissionResponse } from "./BaseJudge.ts";
import {Judge} from"./BaseJudge.ts"
interface LibraryCProblemId extends ProblemId {
  problem: string;
}

interface LibraryCSubmissionResponse extends SubmissionResponse {
  id?: number | string;
}

export class LibraryCJudge extends Judge {
  constructor() {
    super("YC", {
      origin: "https://judge.yosupo.jp",
      submitUrl: "https://v3.api.judge.yosupo.jp/submit",
      submissionUrl: "https://judge.yosupo.jp/submission/{id}",
    });
  }

  detect(url: string): boolean {
    return url.includes("judge.yosupo.jp");
  }

  parseURL(url: string): LibraryCProblemId {
    // Format: /competitions/{comp}/.../problem/{prob}/submit
    const parts = url.replace(/^https?:\/\//, "").split("/");
    return {
      problem: parts[2],
    };
  }

  async submit(code: string, problemIds: LibraryCProblemId, credentials: AuthCredentials): Promise<SubmissionResponse> {
    const url = this.config.submitUrl;
    const requestStr = JSON.stringify({
      problem: problemIds.problem,
      source: code,
      lang: "cpp17",
      tle_knockout: true,
    });
    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.token}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(requestStr),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            const body = JSON.parse(data);
            resolve({
              body,
              status: res.statusCode ?? 0,
              headers: res.headers as Record<string, string | string[]>,
            });
          });
        },
      );

      req.on("error", reject);
      req.write(requestStr);
      req.end();
    });
  }

  extractId(response: SubmissionResponse | string): string | null {
    try {
      const resp = response as LibraryCSubmissionResponse;
      console.log(response);
      return String(resp.id);
    } catch {
      // Fallback to regex
      const responseStr = typeof response === 'string' ? response : (response.body as string);
      const match = responseStr.match(/"id":(\d+)/);
      return match ? match[1] : null;
    }
  }

  getSubmissionUrl(submissionId: string): string {
    return this.config.submissionUrl.replace("{id}", submissionId);
  }

  isUsingBearerToken(): boolean {
    return true;
  }

  isAutomatedAuth(): boolean {
    return false;
  }
}
