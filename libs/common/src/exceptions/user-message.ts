import { AppException } from './app.exception';

export function toUserMessage(error: unknown): string {
  if (error instanceof AppException) {
    return error.userMessage;
  }
  return 'Something went wrong. Please try again later.';
}
