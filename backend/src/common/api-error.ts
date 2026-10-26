export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: Record<string, string>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function redactSensitive(text: string, secrets: string[]) {
  let output = text;
  for (const secret of secrets) {
    if (secret.length < 8) continue;
    output = output.split(secret).join('[redacted]');
  }
  return output.slice(0, 400);
}
