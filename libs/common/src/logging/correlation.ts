import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const storage = new AsyncLocalStorage<{ correlationId: string }>();

export function runWithCorrelationId<T>(
  fn: () => T,
  correlationId: string = randomUUID(),
): T {
  return storage.run({ correlationId }, fn);
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}