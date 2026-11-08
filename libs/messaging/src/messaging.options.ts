export const MESSAGING_OPTIONS = Symbol('MESSAGING_OPTIONS');

export interface MessagingOptions {
  url: string;
  /** Таймаут подтверждения публикации брокером, мс. */
  publishTimeoutMs?: number;
}
