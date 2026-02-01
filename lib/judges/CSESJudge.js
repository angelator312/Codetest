import https from "https";
import fs from "fs";
import { Judge } from "./BaseJudge.js";
import zlib from "zlib"
export class CSESJudge extends Judge {
  constructor() {
    super("CSES", {
      origin: "https://cses.fi",
      loginUrl: "https://cses.fi/login",
      submitUrl: "https://cses.fi/course/send.php",
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
  }

  detect(url) {
    return url.includes("cses.fi");
  }

  parseURL(url) {
    const match = url.match(/task\/(\d+)/);
    if (!match) throw new Error("Invalid CSES URL");
    return {
      taskId: match[1],
      type: url.includes("/course/") ? "course" : "problemset",
    };
  }

  detectLanguage(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    return this.config.languages[ext] || "C++";
  }

  // Save debug info to file
  debugLog(filename, content) {
    fs.writeFileSync(`./debug_${filename}.html`, content);
    console.log(`   💾 Debug saved to debug_${filename}.html`);
  }

  async httpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const postData = options.body || "";

      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": options.referer ? "same-origin" : "none",
          "cache-control": "max-age=0",
          ...options.headers,
        },
      };

      if (options.cookie) {
        reqOptions.headers["Cookie"] = options.cookie;
      }

      // Handle gzip compression

      const req = https.request(reqOptions, (res) => {
        let chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const encoding = res.headers["content-encoding"];

          let data;
          if (encoding === "gzip") {
            data = zlib.gunzipSync(buffer).toString();
          } else if (encoding === "deflate") {
            data = zlib.inflateSync(buffer).toString();
          } else {
            data = buffer.toString();
          }

          resolve({
            data,
            headers: res.headers,
            statusCode: res.statusCode,
            cookies: res.headers["set-cookie"],
          });
        });
      });

      req.on("error", reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  extractCSRF(html) {
    console.log("   Looking for CSRF token...");

    // Debug: show what we're searching in
    const csrfInput = html.match(/<input[^>]*csrf[^>]*>/i);
    if (csrfInput) {
      console.log("   Found CSRF input:", csrfInput[0]);
    }

    const patterns = [
      /<input[^>]*name=["']csrf_token["'][^>]*value=["']([^"']+)["']/i,
      /<input[^>]*value=["']([^"']+)["'][^>]*name=["']csrf_token["']/i,
      /name=["']csrf_token["']\s*value=["']([a-f0-9]+)/i,
      /value=["']([a-f0-9]{32,64})["'][^>]*name=["']csrf_token["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        console.log(
          "   ✅ Matched pattern:",
          match[1].substring(0, 10) + "...",
        );
        return match[1];
      }
    }
    return null;
  }

  async authenticateInteractive() {
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const ask = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    console.log(`
    ╔════════════════════════════════════════════════════════╗
    ║         CSES Authentication (Debug Mode)               ║
    ╚════════════════════════════════════════════════════════╝
    `);

    const username = await ask("Username/Email: ");
    const password = await ask("Password: ");
    rl.close();

    console.log("\n🌐 Step 1: Fetching login page...");

    try {
      // Step 1: Get login page
      const loginPage = await this.httpsRequest(this.config.loginUrl);
      console.log(`   Status: ${loginPage.statusCode}`);
      console.log(
        `   Cookies received: ${loginPage.cookies ? loginPage.cookies.length : 0}`,
      );

      // Save for inspection
      this.debugLog("1_login_page", loginPage.data);

      const csrfToken = this.extractCSRF(loginPage.data);

      if (!csrfToken) {
        console.error("   ❌ CSRF token not found!");
        console.log("   HTML preview (first 1000 chars):");
        console.log(loginPage.data.substring(0, 1000));
        throw new Error("CSRF extraction failed");
      }

      console.log(`   Token: ${csrfToken.substring(0, 15)}...`);

      // Extract PHPSESSID
      let phpSession = null;
      if (loginPage.cookies) {
        const sessionCookie = loginPage.cookies.find((c) =>
          c.includes("PHPSESSID"),
        );
        if (sessionCookie) {
          phpSession = sessionCookie.match(/PHPSESSID=([^;]+)/)?.[1];
        }
      }

      if (!phpSession) {
        throw new Error("No PHPSESSID in initial response");
      }
      console.log(`   Session: ${phpSession.substring(0, 10)}...`);

      // Step 2: Submit login
      console.log("\n🌐 Step 2: Submitting login...");

      const formData = `nick=${encodeURIComponent(username)}&pass=${encodeURIComponent(password)}&csrf_token=${encodeURIComponent(csrfToken)}`;

      console.log(`   Form data length: ${formData.length} bytes`);
      console.log(`   Sending POST to ${this.config.loginUrl}`);

      const loginResult = await this.httpsRequest(this.config.loginUrl, {
        method: "POST",
        body: formData,
        cookie: `PHPSESSID=${phpSession}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://cses.fi/login",
          Origin: "https://cses.fi",
        },
      });

      console.log(`   Status: ${loginResult.statusCode}`);
      console.log(`   Location: ${loginResult.headers.location || "none"}`);
      console.log(
        `   New cookies: ${loginResult.cookies ? loginResult.cookies.length : 0}`,
      );

      // Save response
      this.debugLog("2_login_result", loginResult.data);

      // Check for errors in response
      const errorMatch = loginPage.data.match(
        /class=["']error["'][^>]*>([^<]+)/i,
      );
      if (errorMatch) {
        console.error(`   ❌ Server error: ${errorMatch[1]}`);
      }

      // Check success indicators
      const hasLogout =
        loginResult.data.includes("/logout") ||
        loginResult.data.includes("Logout");
      const hasAccount = loginResult.data.includes("account");
      const isRedirect = loginResult.statusCode === 302;

      console.log(`\n📊 Success checks:`);
      console.log(`   Has logout: ${hasLogout}`);
      console.log(`   Has account: ${hasAccount}`);
      console.log(`   Is redirect: ${isRedirect}`);

      // Step 3: Follow redirect if needed
      let finalData = loginResult.data;
      let finalCookies = loginResult.cookies;

      if (isRedirect && loginResult.headers.location) {
        console.log("\n🌐 Step 3: Following redirect...");
        const redirectPath = loginResult.headers.location;
        const redirectUrl = redirectPath.startsWith("http")
          ? redirectPath
          : `https://cses.fi${redirectPath}`;

        console.log(`   To: ${redirectUrl}`);

        // Extract new PHPSESSID if set
        if (loginResult.cookies) {
          const newSession = loginResult.cookies.find((c) =>
            c.includes("PHPSESSID"),
          );
          if (newSession) {
            phpSession = newSession.match(/PHPSESSID=([^;]+)/)?.[1];
            console.log(
              `   Updated session: ${phpSession.substring(0, 10)}...`,
            );
          }
        }

        const redirectResult = await this.httpsRequest(redirectUrl, {
          cookie: `PHPSESSID=${phpSession}`,
        });

        console.log(`   Status: ${redirectResult.statusCode}`);
        this.debugLog("3_redirect_page", redirectResult.data);

        finalData = redirectResult.data;
        finalCookies = redirectResult.cookies;
      }

      // Final verification
      console.log("\n🔍 Final verification...");
      const finalCheck = await this.httpsRequest("https://cses.fi/problemset", {
        cookie: `PHPSESSID=${phpSession}`,
      });

      this.debugLog("4_problemset_page", finalCheck.data);

      const reallyLoggedIn =
        finalCheck.data.includes("/logout") ||
        finalCheck.data.includes("Logout");
      console.log(`   Logged in check: ${reallyLoggedIn ? "✅ YES" : "❌ NO"}`);

      if (reallyLoggedIn) {
        const userMatch =
          finalCheck.data.match(/class="account"[^>]*>([^<]+)/i) ||
          finalCheck.data.match(/href="\/user\/\d+"[^>]*>([^<]+)/i);
        const displayName = userMatch ? userMatch[1].trim() : username;

        console.log(`\n✅ SUCCESS! Logged in as: ${displayName}`);

        return {
          php: phpSession,
          csrf: csrfToken,
          username: displayName,
        };
      } else {
        throw new Error("Login verification failed - check credentials");
      }
    } catch (error) {
      console.error("\n💥 FATAL ERROR:", error.message);
      console.error(error.stack);
      throw error;
    }
  }

  async submit(code, problemId, credentials) {
    const boundary =
      "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const body = [
      `------${boundary}`,
      `Content-Disposition: form-data; name="csrf_token"`,
      ``,
      credentials.csrf,
      `------${boundary}`,
      `Content-Disposition: form-data; name="task"`,
      ``,
      problemId.taskId,
      `------${boundary}`,
      `Content-Disposition: form-data; name="lang"`,
      ``,
      this.detectLanguage("code.cpp"),
      `------${boundary}`,
      `Content-Disposition: form-data; name="code"`,
      ``,
      code,
      `------${boundary}--`,
    ].join("\r\n");

    return new Promise((resolve, reject) => {
      const req = https.request(
        this.config.submitUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=----${boundary}`,
            "Content-Length": Buffer.byteLength(body),
            Cookie: `PHPSESSID=${credentials.php}`,
            Referer: `https://cses.fi/${problemId.type}/task/${problemId.taskId}/`,
            Origin: "https://cses.fi",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve({ data, headers: res.headers }));
        },
      );

      req.on("error", reject);
      req.write(body);
      req.end();
    });
  }

  extractId(response) {
    const match = response.data.match(/get_status\.php\?entry=(\d+)/);
    return match ? match[1] : null;
  }

  getSubmissionUrl(submissionId, problemId) {
    return `${this.config.baseUrl}/problemset/result/${submissionId}/`;
  }
  isUsingBearerToken() {
    return false;
  }
  isAutomatedAuth() {
    return true;
  }
}
