import { z } from 'zod';
import { defineEvent } from '../envelope';

/** Цена в десятых: 60 = 6.0 */
export const PlayerPriceChangedV1 = defineEvent(
  'player.price_changed',
  1,
  z.object({
    player_id: z.number().int().positive(),
    old_price: z.number().int().positive(),
    new_price: z.number().int().positive(),
  }),
);