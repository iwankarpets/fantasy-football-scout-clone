import { z } from 'zod';

export const EVENT_SOURCES = [
  'ingestion-service',
  'analytics-service',
  'user-service',
  'notification-service',
] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];

/** Общий конверт: type и version фиксируются литералами, data у каждого события своя. */
export function envelopeSchema<T extends string, V extends number, D extends z.ZodType>(
  type: T,
  version: V,
  data: D,
) {
  return z.object({
    event_id: z.uuid(),
    type: z.literal(type),
    version: z.literal(version),
    occurred_at: z.iso.datetime(),
    correlation_id: z.string().min(1),
    source: z.enum(EVENT_SOURCES),
    data,
  });
}

/** Описание события: имя, версия, схема data и схема всего конверта. */
export function defineEvent<T extends string, V extends number, D extends z.ZodType>(
  type: T,
  version: V,
  dataSchema: D,
) {
  return { type, version, dataSchema, schema: envelopeSchema(type, version, dataSchema) } as const;
}

export type AnyEventDefinition = {
  readonly type: string;
  readonly version: number;
  readonly dataSchema: z.ZodType;
  readonly schema: z.ZodType;
};
