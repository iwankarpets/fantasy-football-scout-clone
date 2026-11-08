import { randomUUID } from 'crypto';
import { z } from 'zod';
import { AnyEventDefinition, EventSource } from './envelope';

export interface EventMeta {
  source: EventSource;
  correlationId?: string;
  /** Для outbox: тот же uuid, что и id строки outbox_events. */
  eventId?: string;
  occurredAt?: Date;
}

/** Собирает конверт и сразу валидирует: кривое событие упадёт внутри транзакции, а не в брокере. */
export function createEvent<D extends AnyEventDefinition>(
  def: D,
  data: z.input<D['dataSchema']>,
  meta: EventMeta,
): z.output<D['schema']> {
  return def.schema.parse({
    event_id: meta.eventId ?? randomUUID(),
    type: def.type,
    version: def.version,
    occurred_at: (meta.occurredAt ?? new Date()).toISOString(),
    correlation_id: meta.correlationId ?? randomUUID(),
    source: meta.source,
    data,
  }) as z.output<D['schema']>;
}
