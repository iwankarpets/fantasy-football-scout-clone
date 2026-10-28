import { z } from 'zod';

export const fixtureSchema = z.object({
  id: z.number().int(),
  code: z.number().int(),
  event: z.number().int().nullable(),            // null у перенесённых матчей
  team_h: z.number().int(),
  team_a: z.number().int(),
  team_h_score: z.number().int().nullable(),
  team_a_score: z.number().int().nullable(),
  kickoff_time: z.string().nullable(),
  team_h_difficulty: z.number().int(),
  team_a_difficulty: z.number().int(),
  started: z.boolean().nullable(),
  finished: z.boolean(),
  finished_provisional: z.boolean(),
  minutes: z.number().int(),
});
// stats в схему не включён: zod по умолчанию отбрасывает неизвестные поля,
// а по документу массив stats в базу не берётся.

export const fixturesSchema = z.array(fixtureSchema);
export type ApiFplFixture = z.infer<typeof fixtureSchema>;