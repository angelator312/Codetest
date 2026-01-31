import https from 'https';
import { Judge } from './BaseJudge.js';

export class PeshoJudge extends Judge {
  constructor() {
    super('Pesho', {
      origin: 'https://pesho.org',
      submitUrl: 'https://pesho.org/api/user/assignments/{assign}/tasks/{task}/submitcode',
      submissionUrl: 'https://pesho.org/assignments/{assign}/submissions/{id}'
    });
  }

  detect(url) {
    return url.includes('pesho.org');
  }

  parseURL(url) {
    // Format: /assignments/{assign}/tasks/{task}
    const parts = url.replace(/^https?:\/\//, '').split('/');
    console.log(parts)
    return {
      assignment: parts[2],
      task: parts[4]
    };
  }

  async submit(code, problemId, credentials) {
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
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  extractId(response) {
    // Format: "Submitted. 12345"
    const match = response.match(/Submitted\.\s*(\d+)/i) || response.match(/(\d+)$/m);
    return match ? match[1] : null;
  }

  getSubmissionUrl(submissionId, problemId) {
    return this.config.submissionUrl
      .replace('{assign}', problemId.assignment)
      .replace('{id}', submissionId);
  }
}
