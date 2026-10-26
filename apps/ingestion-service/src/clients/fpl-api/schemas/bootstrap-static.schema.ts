import { z } from 'zod';

/**
 * Проверяем только то, что реально используем. passthrough() оставляет
 * остальные поля, чтобы целый объект попал в колонку raw.
 * FPL отдаёт многие числа строкой, поэтому numLike = string | number.
 */
const numLike = z.union([z.string(), z.number()]);

export const teamSchema = z
  .object({
    id: z.number(),
    code: z.number(),
    name: z.string(),
    short_name: z.string(),
    strength_overall_home: z.number(),
    strength_overall_away: z.number(),
    strength_attack_home: z.number(),
    strength_attack_away: z.number(),
    strength_defence_home: z.number(),
    strength_defence_away: z.number(),
    played: z.number(),
    win: z.number(),
    draw: z.number(),
    loss: z.number(),
    points: z.number(),
    position: z.number(),
    form: numLike.nullish(),
    strength: z.number().nullish(),
  })
  .passthrough();

export const elementTypeSchema = z
  .object({
    id: z.number(),
    singular_name: z.string(),
    singular_name_short: z.string(),
    plural_name: z.string(),
    plural_name_short: z.string(),
    squad_select: z.number(),
    squad_min_play: z.number(),
    squad_max_play: z.number(),
    element_count: z.number(),
  })
  .passthrough();

export const gameweekSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    deadline_time: z.string(),
    deadline_time_epoch: z.number(),
    finished: z.boolean(),
    data_checked: z.boolean(),
    is_previous: z.boolean(),
    is_current: z.boolean(),
    is_next: z.boolean(),
    release_time: z.string().nullish(),
    average_entry_score: z.number().nullish(),
    highest_score: z.number().nullish(),
    top_element: z.number().nullish(),
    most_selected: z.number().nullish(),
    most_transferred_in: z.number().nullish(),
    most_captained: z.number().nullish(),
    most_vice_captained: z.number().nullish(),
  })
  .passthrough();

export const playerSchema = z
  .object({
    id: z.number(),
    code: z.number(),
    team: z.number(),
    element_type: z.number(),
    first_name: z.string(),
    second_name: z.string(),
    web_name: z.string(),
    now_cost: z.number(),
    status: z.string(),
    chance_of_playing_next_round: z.number().nullish(),
    news: z.string().nullish(),
    news_added: z.string().nullish(),
    selected_by_percent: numLike,
    form: numLike,
    points_per_game: numLike,
    total_points: z.number(),
    minutes: z.number(),
    starts: z.number(),
    goals_scored: z.number(),
    assists: z.number(),
    clean_sheets: z.number(),
    bps: z.number(),
    expected_goals: numLike,
    expected_assists: numLike,
    ict_index: numLike,
    defensive_contribution: z.number().nullish(),
    ep_next: numLike.nullish(),
    ep_this: numLike.nullish(),
    cost_change_event: z.number(),
    cost_change_start: z.number(),
    transfers_in_event: z.number(),
    transfers_out_event: z.number(),
  })
  .passthrough();

export const bootstrapStaticSchema = z
  .object({
    events: z.array(gameweekSchema),
    teams: z.array(teamSchema),
    elements: z.array(playerSchema),
    element_types: z.array(elementTypeSchema),
  })
  .passthrough();

export type ApiTeam = z.infer<typeof teamSchema>;
export type ApiElementType = z.infer<typeof elementTypeSchema>;
export type ApiGameweek = z.infer<typeof gameweekSchema>;
export type ApiPlayer = z.infer<typeof playerSchema>;
export type BootstrapStatic = z.infer<typeof bootstrapStaticSchema>;
