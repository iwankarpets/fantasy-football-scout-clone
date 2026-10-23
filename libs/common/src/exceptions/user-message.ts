import { AppException } from './app.exception';
 
export function toUserMessage(error: unknown): string {
  if (error instanceof AppException) return error.userMessage;
  return 'Что-то пошло не так. Попробуйте позже.';
}
 