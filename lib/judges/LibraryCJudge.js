import https from "https";
import { Judge } from "./BaseJudge.js";

export class LibraryCJudge extends Judge {
  constructor() {
    super("YC", {
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
    return {
      problem: parts[2],
    };
  }

  async submit(code, problemIds, credentials) {
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
            resolve(body);
          });
        },
      );

      req.on("error", reject);
      req.write(requestStr);
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

  isUsingBearerToken() {
    return true;
  }
}
