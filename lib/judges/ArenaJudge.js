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
  isUsingBearerToken() {
    return false;
  }
  async authenticateInteractive() {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve, reject) => {
      rl.question('Enter Arena username: ', (username) => {
        rl.question('Enter Arena password: ', async (password) => {
          try {
            // Attempt to login and get the bearer token
            const token = await this.getTokenFromCredentials(username, password);
            rl.close();
            resolve({ token });
          } catch (error) {
            rl.close();
            reject(error);
          }
        });
      });
    });
  }

  async getTokenFromCredentials(username, password) {
    // JHipster applications typically use /api/authenticate endpoint
    // with a JSON payload containing username and password
    const https = await import('https');

    const credentials = {
      username: username,
      password: password
    };

    const postData = JSON.stringify(credentials);

    const options = {
      hostname: 'arena.olimpiici.com',
      port: 443,
      path: '/api/authenticate',  // Standard JHipster authentication endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (compatible; Codetest Bot)'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            // JHipster typically returns JWT token in 'id_token' field
            if (response.id_token) {
              resolve(response.id_token);
            } else if (response.token) {
              resolve(response.token);
            } else if (response.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error('Authentication failed: No token received from server'));
            }
          } catch (e) {
            reject(new Error(`Authentication failed: Invalid response format - ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Authentication failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  isAutomatedAuth() {
    return true;
  }
}
