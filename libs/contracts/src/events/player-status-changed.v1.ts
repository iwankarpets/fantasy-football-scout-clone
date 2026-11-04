import { z } from 'zod';
import { defineEvent } from '../envelope';

export const PLAYER_STATUSES = ['a', 'd', 'i', 's', 'u'] as const;

export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

export const PlayerStatusChangedV1 = defineEvent(
  'player.status_changed',
  1,
  z.object({
    player_id: z.number().int().positive(),
    old_status: z.enum(PLAYER_STATUSES),
    new_status: z.enum(PLAYER_STATUSES),
    chance_next_round: z.number().int().min(0).max(100).nullable(),
    news: z.string(),
    news_added_at: z.iso.datetime().nullable(),
    /** Что именно изменилось; при смене только новости old_status === new_status. */
    changed: z.array(z.enum(['status', 'news'])).min(1),
  }),
);