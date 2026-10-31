import { z } from 'zod';

const int = z.number().int();

export const elementHistoryItemSchema = z.object({
  element: int,
  fixture: int,
  round: int,
  opponent_team: int,
  was_home: z.boolean(),
  minutes: int,
  starts: int,
  goals_scored: int,
  assists: int,
  clean_sheets: int,
  goals_conceded: int,
  saves: int,
  bonus: int,
  bps: int,
  yellow_cards: int,
  red_cards: int,
  total_points: int,

  // API отдаёт строками ("0.20"), к числу приводим в mapper
  expected_goals: z.string(),
  expected_assists: z.string(),
  expected_goal_involvements: z.string(),
  expected_goals_conceded: z.string(),

  // цена (в десятых), владельцы и трансферы на момент тура
  value: int,
  selected: int,
  transfers_in: int,
  transfers_out: int,
  transfers_balance: int,
});

export const elementSummarySchema = z.object({
  history: z.array(elementHistoryItemSchema), // пустой у игрока без матчей
});

export type ApiFplElementHistoryItem = z.infer<typeof elementHistoryItemSchema>;
export type ApiFplElementSummary = z.infer<typeof elementSummarySchema>;