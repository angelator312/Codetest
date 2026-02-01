export class Judge {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }
  // Detect if URL belongs to this judge
  detect(url) {
    throw new Error("Judge must implement detect()");
  }
  // Extract problem ID from URL
  parseURL(url) {
    throw new Error("Judge must implement parseURL()");
  }
  // Submit code
  async submit(code, problemId, credentials) {
    throw new Error("Judge must implement submit()");
  }
  // Extract submission ID from response
  extractId(response) {
    throw new Error("Judge must implement extractId()");
  }
  // Get submission URL for browser
  getSubmissionUrl(submissionId, problemId) {
    throw new Error("Judge must implement getSubmissionUrl()");
  }
  isUsingBearerToken() {
    throw new Error("Judge must implement isUsingBearerToken()");
  }
  isAutomatedAuth() {
    throw new Error("Judge must implement isAutomatedAuth()");
  }
}
