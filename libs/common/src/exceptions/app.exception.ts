export interface AppExceptionOptions {
  code: string;
  status?: number;
  userMessage?: string;
  cause?: unknown;
}

export class AppException extends Error {
  readonly code: string;
  readonly status: number;
  readonly userMessage: string;

  constructor(message: string, options: AppExceptionOptions) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.status = options.status ?? 500;
    this.userMessage = options.userMessage ?? 'Something went wrong. Please try again later.';
  }
}

export class EntityNotFoundException extends AppException {
  constructor(entity: string, id: string | number) {
    super(`${entity} ${id} not found`, {
      code: 'NOT_FOUND',
      status: 404,
      userMessage: 'Nothing was found.',
    });
  }
}

export class UpstreamUnavailableException extends AppException {
  constructor(service: string, cause?: unknown) {
    super(`${service} is unavailable`, {
      code: 'UPSTREAM_UNAVAILABLE',
      status: 503,
      userMessage: 'The service is temporarily unavailable. Please try again later.',
      cause,
    });
  }
}

export class AccessDeniedException extends AppException {
  constructor(message = 'Access denied') {
    super(message, {
      code: 'ACCESS_DENIED',
      status: 403,
      userMessage: 'This command is not available to you.',
    });
  }
}

export class UpstreamBadResponseException extends AppException {
  constructor(service: string, details: string, cause?: unknown) {
    super(`${service} returned an unexpected response: ${details}`, {
      code: 'UPSTREAM_BAD_RESPONSE',
      status: 502,
      userMessage: 'The service returned an invalid response. Please try again later.',
      cause,
    });
  }
}
