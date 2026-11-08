import { z } from 'zod';
import { defineEvent } from '../envelope';

/**
 * hours_left это порог напоминания (24 или 3), а не фактический остаток:
 * при опоздании джобы событие всё равно относится к «напоминанию за N часов».
 * Фактическое время получатель считает по deadline_at.
 */
export const DeadlineApproachingV1 = defineEvent(
  'gameweek.deadline_approaching',
  1,
  z.object({
    gameweek_number: z.number().int().positive(),
    deadline_at: z.iso.datetime(),
    hours_left: z.number().int().positive(),
  }),
);
