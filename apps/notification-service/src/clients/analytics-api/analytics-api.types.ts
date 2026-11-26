// Копия форм ответов analytics-service: сервисы не импортируют код друг друга.

export const TOP_METRICS = [
  'score',
  'form_3',
  'form_5',
  'avg_minutes_5',
  'minutes_reliability',
  'points_per_million',
  'xgi_per90_5',
  'ownership_trend',
] as const;
export type TopMetric = (typeof TOP_METRICS)[number];

export const POSITIONS = ['GKP', 'DEF', 'MID', 'FWD'] as const;
export type TopPosition = (typeof POSITIONS)[number];

export interface PlayerSearchItem {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team_id: number;
  team_short_name: string;
  position: string;
  now_cost: number;
  status: string;
}

export interface PlayerTopItem {
  id: number;
  web_name: string;
  team_id: number;
  team_short_name: string;
  position: string;
  now_cost: number;
  status: string;
  as_of_gameweek: number;
  value: number;
  score: number | null;
  position_rank: number | null;
}

export interface PlayerTopResponse {
  gameweek: number | null;
  metric: TopMetric;
  position: TopPosition | null;
  items: PlayerTopItem[];
}

export interface TeamDifficultyItem {
  team_id: number;
  team_short_name: string;
  as_of_gameweek: number;
  horizon: number;
  difficulty: number | null;
  matches_count: number;
  has_double: boolean;
  has_blank: boolean;
}

export interface WatchlistItem {
  player_id: number;
  added_at: string;
}
export interface WatchlistChange {
  changed: boolean;
}
