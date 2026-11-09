import { z } from 'zod';
import { defineEvent } from '../envelope';

/** Тур завершён: finished && data_checked. Публикуется один раз на тур. */
export const GameweekFinishedV1 = defineEvent(
  'gameweek.finished',
  1,
  z.object({
    gameweek_number: z.number().int().positive(),
  }),
);
