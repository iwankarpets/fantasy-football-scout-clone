import { z } from 'zod';
import { AnyEventDefinition } from './envelope';
import { SnapshotReadyV1 } from './events/snapshot-ready.v1';
import { PlayerStatusChangedV1 } from './events/player-status-changed.v1';
import { PlayerPriceChangedV1 } from './events/player-price-changed.v1';
import { DeadlineApproachingV1 } from './events/deadline-approaching.v1';

export const EVENT_DEFINITIONS = [
  SnapshotReadyV1,
  PlayerStatusChangedV1,
  PlayerPriceChangedV1,
  DeadlineApproachingV1,
] as const;

export type EventType = (typeof EVENT_DEFINITIONS)[number]['type'];

const registry = new Map<string, AnyEventDefinition>(
  EVENT_DEFINITIONS.map((d) => [`${d.type}@${d.version}`, d]),
);

export type ParseResult =
  | { ok: true; event: z.output<(typeof EVENT_DEFINITIONS)[number]['schema']> }
  | { ok: false; reason: string };

/** Для получателей: любой not ok уходит в очередь для разбора (DLQ). */
export function parseEvent(raw: unknown): ParseResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'not an object' };
  }
  const { type, version } = raw as { type?: unknown; version?: unknown };

  const def = registry.get(`${String(type)}@${String(version)}`);
  if (!def) {
    return { ok: false, reason: `unknown event ${String(type)} v${String(version)}` };
  }

  const res = def.schema.safeParse(raw);
  return res.success
    ? { ok: true, event: res.data as never }
    : { ok: false, reason: z.prettifyError(res.error) };
}
