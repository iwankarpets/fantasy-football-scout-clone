import { z } from 'zod';
import { defineEvent } from '../envelope';
import { USER_WATCHLIST_CHANGED } from './events';

export const UserWatchlistChangedV1 = defineEvent(
  USER_WATCHLIST_CHANGED,
  1,
  z.object({
    user_id: z.uuid(),
    player_id: z.number().int().positive(),
    action: z.enum(['added', 'removed']),
  }),
);
