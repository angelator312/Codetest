import https from "https";
import type {
  ProblemId,
  AuthCredentials,
  SubmissionResponse,
} from "./BaseJudge.ts";
import { Judge } from "./BaseJudge.ts";

interface CertProblemId extends ProblemId {
  taskId: string;
  contestId?: string;
}

interface CertSubmissionResponse {
  id?: string;
  submissionId?: string;
  task?: { id: string };
  submitted?: boolean;
  [key: string]: unknown;
}

export class CertJudge extends Judge {
  constructor() {
    super("Cert", {
      origin: "https://cert.olimpiici.com",
      submitUrl:
        "https://cert.olimpiici.com/api/user/tasks/{taskId}/submissions",
      submissionUrl: "https://cert.olimpiici.com/task/{taskId}/submission/{id}",
      languages: {
        cpp: "cpp",
        cc: "cpp",
        c: "c",
        java: "java",
        py: "py",
        py3: "py",
        pypy: "py",
        rs: "rs",
        go: "go",
        js: "js",
      },
    });
  }

  detect(url: string): boolean {
    return url.includes("cert.olimpiici.com");
  }

  parseURL(url: string): CertProblemId {
    // Format: /task/{taskId} or /contest/{contestId}/task/{taskId}
    // Also supports ?contestId=X query parameter
    const taskMatch = url.match(/\/task\/(\d+)/);
    const contestMatch = url.match(/\/contest\/(\d+)/);
    const contestQuery = url.match(/[?&]contestId=(\d+)/);

    if (!taskMatch) {
      throw new Error("Invalid Cert URL format: no task ID found");
    }

    const result: CertProblemId = {
      taskId: taskMatch[1],
    };

    if (contestMatch) {
      result.contestId = contestMatch[1];
    } else if (contestQuery) {
      result.contestId = contestQuery[1];
    }

    return result;
  }

  detectLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return this.config.languages?.[ext] || "cpp";
  }

  async submit(
    code: string,
    problemId: CertProblemId,
    credentials: AuthCredentials,
  ): Promise<SubmissionResponse> {
    const auth = Buffer.from(
      `${credentials.username}:${credentials.password}`,
    ).toString("base64");

    // Build URL: /api/user/tasks/{taskId}/submissions?contestId={contestId}
    let url = this.config.submitUrl.replace("{taskId}", problemId.taskId);
    if (problemId.contestId) {
      url += `?contestId=${problemId.contestId}`;
    }

    // Build multipart/form-data matching the browser's exact submission format:
    // Fields: code, extension (file extension)
    const boundary =
      "----CertBoundary" + Math.random().toString(36).substring(2, 15);

    const parts: string[] = [];

    // Code field
    parts.push(`------${boundary}`);
    parts.push('Content-Disposition: form-data; name="code"');
    parts.push("");
    parts.push(code);

    // Extension field (file extension, e.g. "cpp")
    parts.push(`------${boundary}`);
    parts.push('Content-Disposition: form-data; name="extension"');
    parts.push("");
    parts.push(this.detectLanguage("code.cpp"));

    // End boundary
    parts.push(`------${boundary}--`);

    const body = parts.join("\r\n");

    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": `multipart/form-data; boundary=----${boundary}`,
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            let parsedBody: CertSubmissionResponse = {};
            try {
              if (data) {
                parsedBody = JSON.parse(data);
              }
            } catch {
              // Response body is not valid JSON; will be available as raw data
            }

            resolve({
              data,
              body: parsedBody,
              status: res.statusCode ?? 0,
              headers: res.headers as Record<string, string | string[]>,
            });
          });
        },
      );

      req.on("error", reject);
      req.write(body);
      req.end();
    });
  }

  extractId(response: SubmissionResponse | string): string | null {
    const resp = typeof response === "string" ? null : response;

    // Try response body first — the API returns {"sid": 10}
    if (resp?.body?.sid != null) {
      return String(resp.body.sid);
    }

    if (resp?.body?.id) {
      return String(resp.body.id);
    }

    if (resp?.body?.submissionId) {
      return String(resp.body.submissionId);
    }

    // Try from headers (location)
    if (resp?.headers) {
      const location = resp.headers.location;
      if (location) {
        const locStr = Array.isArray(location) ? location[0] : location;
        const match = locStr.match(/\/submission\/(\d+)/);
        if (match) return match[1];
      }
    }

    // Fallback to regex in data
    const responseStr =
      typeof response === "string" ? response : (resp?.data ?? "");
    const match =
      responseStr.match(/"sid"\s*:\s*"?(\d+)"?/) ||
      responseStr.match(/"id"\s*:\s*"?(\d+)"?/) ||
      responseStr.match(/\/submission\/(\d+)/) ||
      responseStr.match(/submissionId["']?\s*:\s*["']?(\d+)/);
    return match ? match[1] : null;
  }

  getSubmissionUrl(submissionId: string, problemId?: CertProblemId): string {
    return this.config.submissionUrl
      .replace("{id}", submissionId)
      .replace("{taskId}", problemId.taskId);
  }

  isUsingBearerToken(): boolean {
    return false;
  }

  isAutomatedAuth(): boolean {
    return false;
  }
}
