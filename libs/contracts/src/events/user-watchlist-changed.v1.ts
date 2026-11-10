import { z } from 'zod';
import { defineEvent } from '../envelope';

export const UserWatchlistChangedV1 = defineEvent(
  'user.watchlist_changed',
  1,
  z.object({
    user_id: z.uuid(),
    player_id: z.number().int().positive(),
    action: z.enum(['added', 'removed']),
  }),
);
