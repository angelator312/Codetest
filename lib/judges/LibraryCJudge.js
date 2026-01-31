import https from "https";
import { Judge } from "./BaseJudge.js";

export class LibraryCJudge extends Judge {
  constructor() {
    super("LibraryC", {
      origin: "https://judge.yosupo.jp",
      submitUrl: "https://v3.api.judge.yosupo.jp/submit",
      submissionUrl: "https://judge.yosupo.jp/submission/{id}",
    });
  }

  detect(url) {
    return url.includes("judge.yosupo.jp");
  }

  parseURL(url) {
    // Format: /competitions/{comp}/.../problem/{prob}/submit
    const parts = url.replace(/^https?:\/\//, "").split("/");
    console.log(parts);
    return {
      competition: parts[3],
      problem: parts[5],
    };
  }

  async submit(code, problemIds, credentials) {
    const url = this.config.submitUrl;
    console.log("URL:", url);
    console.log(`Bearer ${credentials.token}`);
    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.token}`,
            "Content-Type": "text/plain",
            "Content-Length": Buffer.byteLength(code),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            const body = JSON.parse(data);
            console.log(body);
            resolve(body);
          });
        },
      );

      req.on("error", reject);
      req.write({
        problem: problemIds.problem,
        code,
      });
      req.end();
    });
  }

  extractId(response) {
    try {
      console.log(response);
      return String(response.id);
    } catch {
      // Fallback to regex
      const match = response.match(/"id":(\d+)/);
      return match ? match[1] : null;
    }
  }

  getSubmissionUrl(submissionId) {
    return this.config.submissionUrl.replace("{id}", submissionId);
  }
}
