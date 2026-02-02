import https from "https";
import { Judge } from "./BaseJudge.js";

export class ArenaJudge extends Judge {
  constructor() {
    super("Arena", {
      origin: "https://arena.olimpiici.com",
      submitUrl:
        "https://arena.olimpiici.com/api/competitions/{comp}/problem/{prob}/submit",
      submissionUrl: "https://arena.olimpiici.com/#/submission/{id}/view",
    });
  }

  detect(url) {
    return url.includes("arena.olimpiici.com");
  }

  parseURL(url) {
    // Format: /competitions/{comp}/.../problem/{prob}/submit
    const parts = url.replace(/^https?:\/\//, "").split("/");
    return {
      competition: parts[3],
      problem: parts[5],
    };
  }

  async submit(code, problemIds, credentials) {
    const url = this.config.submitUrl
      .replace("{comp}", problemIds.competition)
      .replace("{prob}", problemIds.problem);
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
            resolve(body);
          });
        },
      );

      req.on("error", reject);
      req.write(code);
      req.end();
    });
  }

  extractId(response) {
    if (!("id" in response)) return;
    try {
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
