export interface JudgeConfig {
  origin: string;
  submitUrl: string;
  submissionUrl: string;
  languages?: Record<string, string>;
  loginUrl?: string;
  baseUrl?: string;
}

export interface ProblemId {
  [key: string]: string;
}

export interface SubmissionResponse {
  data?: string;
  body?: any;
  headers: Record<string, string | string[]>;
  status: number;
  cookies?: Record<string, string>;
}

export interface AuthCredentials {
  token?: string;
  username?: string;
  password?: string;
  php?: string;
  [key: string]: string | undefined;
}

export abstract class Judge {
  name: string;
  config: JudgeConfig;

  constructor(name: string, config: JudgeConfig) {
    this.name = name;
    this.config = config;
  }

  // Detect if URL belongs to this judge
  abstract detect(url: string): boolean;

  // Extract problem ID from URL
  abstract parseURL(url: string): ProblemId;

  // Submit code
  abstract submit(code: string, problemId: ProblemId, credentials: AuthCredentials): Promise<SubmissionResponse | string>;

  // Extract submission ID from response
  abstract extractId(response: SubmissionResponse | string): string | null;

  // Get submission URL for browser
  abstract getSubmissionUrl(submissionId: string, problemId?: ProblemId): string;

  abstract isUsingBearerToken(): boolean;

  abstract isAutomatedAuth(): boolean;

  authenticateInteractive?(): Promise<AuthCredentials>;

  reloadAuth?(credentials: AuthCredentials): Promise<AuthCredentials>;
}
