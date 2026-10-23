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
    this.userMessage = options.userMessage ?? 'Что-то пошло не так. Попробуйте позже.';
  }
}

export class EntityNotFoundException extends AppException {
  constructor(entity: string, id: string | number) {
    super(`${entity} ${id} not found`, {
      code: 'NOT_FOUND',
      status: 404,
      userMessage: 'Ничего не найдено.',
    });
  }
}

export class UpstreamUnavailableException extends AppException {
  constructor(service: string, cause?: unknown) {
    super(`${service} is unavailable`, {
      code: 'UPSTREAM_UNAVAILABLE',
      status: 503,
      userMessage: 'Сервис временно недоступен. Попробуйте чуть позже.',
      cause,
    });
  }
}

export class AccessDeniedException extends AppException {
  constructor(message = 'Access denied') {
    super(message, {
      code: 'ACCESS_DENIED',
      status: 403,
      userMessage: 'Эта команда вам недоступна.',
    });
  }
}