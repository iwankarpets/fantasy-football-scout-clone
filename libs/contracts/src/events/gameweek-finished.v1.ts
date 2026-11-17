import { z } from 'zod';
import { defineEvent } from '../envelope';
import { GAMWEEK_FINISHED } from './events';

/** Тур завершён: finished && data_checked. Публикуется один раз на тур. */
export const GameweekFinishedV1 = defineEvent(
  GAMWEEK_FINISHED,
  1,
  z.object({
    gameweek_number: z.number().int().positive(),
  }),
);
