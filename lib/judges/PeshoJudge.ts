import https from 'https';
import type {  ProblemId, AuthCredentials, SubmissionResponse } from "./BaseJudge.ts";
import {Judge} from"./BaseJudge.ts"
interface PeshoProblemId extends ProblemId {
  assignment: string;
  task: string;
}

export class PeshoJudge extends Judge {
  constructor() {
    super('Pesho', {
      origin: 'https://pesho.org',
      submitUrl: 'https://pesho.org/api/user/assignments/{assign}/tasks/{task}/submitcode',
      submissionUrl: 'https://pesho.org/assignments/{assign}/submissions/{id}'
    });
  }

  detect(url: string): boolean {
    return url.includes('pesho.org');
  }

  parseURL(url: string): PeshoProblemId {
    // Format: /assignments/{assign}/tasks/{task}
    const parts = url.replace(/^https?:\/\//, '').split('/');
    return {
      assignment: parts[2],
      task: parts[4]
    };
  }

  async submit(code: string, problemId: PeshoProblemId, credentials: AuthCredentials): Promise<SubmissionResponse> {
    const url = this.config.submitUrl
      .replace('{assign}', problemId.assignment)
      .replace('{task}', problemId.task);

    const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    const body = `code=${encodeURIComponent(code)}`;

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          data,
          status: res.statusCode ?? 0,
          headers: res.headers as Record<string, string | string[]>
        }));
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  extractId(response: SubmissionResponse | string): string | null {
    const responseStr = typeof response === 'string' ? response : (response.data ?? '');
    // Format: "Submitted. 12345"
    const match = responseStr.match(/Submitted\.\s*(\d+)/i) || responseStr.match(/(\d+)$/m);
    return match ? match[1] : null;
  }

  getSubmissionUrl(submissionId: string, problemId?: PeshoProblemId): string {
    if (!problemId) {
      return this.config.submissionUrl.replace('{id}', submissionId);
    }
    return this.config.submissionUrl
      .replace('{assign}', problemId.assignment)
      .replace('{id}', submissionId);
  }

  isUsingBearerToken(): boolean {
    return false;
  }

  isAutomatedAuth(): boolean {
    return false;
  }
}
