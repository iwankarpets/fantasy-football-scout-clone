import { z } from 'zod';
import { defineEvent } from '../envelope';

export const SNAPSHOT_UPDATED = ['teams', 'gameweeks', 'players', 'fixtures', 'player_history'] as const;

/** Данных нет, только сигнал «забери свежее». gameweek_number может быть null в межсезонье. */
export const SnapshotReadyV1 = defineEvent(
  'snapshot.ready',
  1,
  z.object({
    gameweek_number: z.number().int().positive().nullable(),
    updated: z.array(z.enum(SNAPSHOT_UPDATED)).min(1),
    sync_run_id: z.number().int().positive(),
  }),
);