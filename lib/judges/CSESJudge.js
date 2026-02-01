import https from "https";
import zlib from "zlib";
import { Judge } from "./BaseJudge.js";
import fs from "fs";

export class CSESJudge extends Judge {
  debugLog(filename, content) {
    // fs.writeFileSync(`./debug_${filename}.html`, content);
    // console.log(`   💾 Debug saved to debug_${filename}.html`);
  }
  constructor() {
    super("CSES", {
      origin: "https://cses.fi",
      loginUrl: "https://cses.fi/login",
      baseUrl: "https://cses.fi",
      languages: {
        cpp: "C++",
        cc: "C++",
        c: "C",
        java: "Java",
        py: "Python3",
        py3: "Python3",
        pypy: "PyPy3",
        rs: "Rust",
        go: "Go",
        js: "JavaScript",
      },
    });
    this.lastCookies = {};
    this.currentCSRF = null;
  }

  detect(url) {
    return url.includes("cses.fi");
  }

  parseURL(url) {
    const match = url.match(/task\/(\d+)/);
    if (!match) throw new Error("Invalid CSES URL format");
    return {
      taskId: match[1],
      type: url.includes("/course/") ? "course" : "problemset",
    };
  }

  detectLanguage(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    return this.config.languages[ext] || "C++";
  }

  async request(url, opts = {}) {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const data = opts.body || "";

      const options = {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: opts.method || "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
          ...(opts.headers || {}),
        },
      };

      // Add cookies
      const cookieStr = opts.cookie || this.getCookieString();
      if (cookieStr) options.headers["Cookie"] = cookieStr;

      const req = https.request(options, (res) => {
        let chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          let body;
          try {
            if (res.headers["content-encoding"] === "gzip") {
              body = zlib.gunzipSync(buf).toString();
            } else {
              body = buf.toString();
            }
          } catch {
            body = buf.toString();
          }

          // Store cookies
          const setCookies = res.headers["set-cookie"];
          if (setCookies) {
            setCookies.forEach((cookieStr) => {
              const [nameValue] = cookieStr.split(";");
              const [name, value] = nameValue.trim().split("=");
              if (name && value) this.lastCookies[name] = value;
            });
          }

          resolve({
            body,
            status: res.statusCode,
            headers: res.headers,
          });
        });
      });

      req.on("error", reject);
      if (data) req.write(data);
      req.end();
    });
  }

  getCookieString() {
    return Object.entries(this.lastCookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  extractCSRF(html) {
    this.debugLog("csrf_file", html);
    const m =
      html.match(/name="csrf_token"[^>]*value="([a-f0-9]{32,40})"/i) ||
      html.match(/value="([a-f0-9]{32,40})"[^>]*name="csrf_token"/i);
    return m ? m[1] : null;
  }

  async authenticateInteractive() {
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const ask = (p) => new Promise((r) => rl.question(p, r));

    console.log("CSES Login\n");
    const user = await ask("Username: ");
    const pass = await ask("Password: ");
    rl.close();

    console.log("\nFetching login page...");
    const page1 = await this.request(this.config.loginUrl);

    const csrf = this.extractCSRF(page1.body);
    if (!csrf) throw new Error("CSRF not found");

    console.log("Submitting login...");
    const form = `nick=${encodeURIComponent(user)}&pass=${encodeURIComponent(
      pass
    )}&csrf_token=${encodeURIComponent(csrf)}`;

    const loginResult = await this.request(this.config.loginUrl, {
      method: "POST",
      body: form,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://cses.fi/login",
        Origin: "https://cses.fi",
      },
    });

    // Follow redirect if needed
    if (loginResult.status === 302 && loginResult.headers.location) {
      const redirectUrl = loginResult.headers.location.startsWith("http")
        ? loginResult.headers.location
        : "https://cses.fi" + loginResult.headers.location;
      await this.request(redirectUrl);
    }

    // Verify login
    const verify = await this.request("https://cses.fi/problemset");
    if (!verify.body.includes("/logout") && !verify.body.includes("Logout")) {
      throw new Error("Login failed");
    }

    const nameMatch = verify.body.match(/class="account"[^>]*>([^<]+)/i);
    const displayName = nameMatch ? nameMatch[1].trim() : user;

    console.log(`✅ Logged in as: ${displayName}`);

    return {
      php: this.lastCookies.PHPSESSID,
      username: displayName,
      password: pass,
    };
  }

  async getProblemCSRF(taskId, type) {
    const problemUrl = `https://cses.fi/${type}/submit/${taskId}/`;

    const res = await this.request(problemUrl);
    const csrf = this.extractCSRF(res.body);

    if (!csrf) {
      console.error("   CSRF not found on problem page");
      console.error("   Body preview:", res.body.substring(0, 500));
    }

    return csrf;
  }
  async submit(code, problemId, credentials) {
    // Restore session
    this.lastCookies.PHPSESSID = credentials.php;

    const lang = this.detectLanguage("code.cpp");
    const { taskId, type } = problemId;

    console.log(`   Task: ${taskId}`);
    console.log(`   Language: ${lang}`);

    // Get FRESH CSRF token from submit page
    const submitPageUrl = `https://cses.fi/${type}/submit/${taskId}/`;
    const pageRes = await this.request(submitPageUrl);
    const freshCSRF = this.extractCSRF(pageRes.body);

    if (!freshCSRF) {
      throw new Error("Could not get CSRF token from submit page");
    }

    // Get option value (CSES uses C++17, C++20 etc)
    const optionMatch = pageRes.body.match(
      /name="option"[^>]*value="([^"]+)"/i
    );
    const optionValue = optionMatch ? optionMatch[1] : "C++17";

    // Build multipart form data matching working request format
    const boundary =
      "----geckoformboundary" + Math.random().toString(36).substring(2, 35);

    const parts = [
      // 1. CSRF token
      `------${boundary}`,
      `Content-Disposition: form-data; name="csrf_token"`,
      "",
      freshCSRF,

      // 2. Task ID
      `------${boundary}`,
      `Content-Disposition: form-data; name="task"`,
      "",
      taskId,

      // 3. File (with proper filename and Content-Type)
      `------${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="solution.cpp"`,
      `Content-Type: text/x-c++src`,
      "",
      code,

      // 4. Language
      `------${boundary}`,
      `Content-Disposition: form-data; name="lang"`,
      "",
      lang,

      // 5. Option (C++17, C++20, etc)
      `------${boundary}`,
      `Content-Disposition: form-data; name="option"`,
      "",
      optionValue,

      // 6. Type
      `------${boundary}`,
      `Content-Disposition: form-data; name="type"`,
      "",
      "course",

      // 7. Target
      `------${boundary}`,
      `Content-Disposition: form-data; name="target"`,
      "",
      type,

      // End boundary
      `------${boundary}--`,
    ];

    const body = parts.join("\r\n");
    const submitUrl = `https://cses.fi/course/send.php`;


    return new Promise((resolve, reject) => {
      const req = https.request(
        submitUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=----${boundary}`,
            "Content-Length": Buffer.byteLength(body),
            Cookie: this.getCookieString(),
            Referer: submitPageUrl, // Fixed: use correct submit page URL
            Origin: "https://cses.fi",
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Upgrade-Insecure-Requests": "1",
          },
        },
        (res) => {
          let chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            // Handle gzip compression
            const buf = Buffer.concat(chunks);
            let data;
            try {
              if (res.headers["content-encoding"] === "gzip") {
                data = zlib.gunzipSync(buf).toString();
              } else {
                data = buf.toString();
              }
            } catch {
              data = buf.toString();
            }

            console.log(`   Response status: ${res.statusCode}`);

            // Update cookies
            const setCookies = res.headers["set-cookie"];
            if (setCookies) {
              setCookies.forEach((cookieStr) => {
                const [nameValue] = cookieStr.split(";");
                const [name, value] = nameValue.trim().split("=");
                if (name && value) this.lastCookies[name] = value;
              });
            }

            // Debug save on error
            if (res.statusCode >= 400) {
              this.debugLog(`error_${res.statusCode}`, data);
              console.log(
                `   ❌ Error response saved to debug_error_${res.statusCode}.html`
              );
            }

            resolve({
              data,
              headers: res.headers,
              status: res.statusCode,
              cookies: this.lastCookies,
            });
          });
        }
      );

      req.on("error", (err) => {
        console.error("   Request error:", err.message);
        reject(err);
      });

      req.write(body);
      req.end();
    });
  }
  extractId(response) {
    // CSES returns redirect to result page on success
    if (response.headers.location) {
      const match = response.headers.location.match(/result\/(\d+)/);
      if (match) return match[1];
    }

    // Look in response body
    const match =
      response.data.match(/result\/(\d+)/) ||
      response.data.match(/view\/(\d+)/);
    return match ? match[1] : null;
  }

  getSubmissionUrl(submissionId, problemId) {
    return `${this.config.baseUrl}/${problemId.type}/result/${submissionId}/`;
  }
  isUsingBearerToken() {
    return false;
  }
  isAutomatedAuth() {
    return true;
  }
}
