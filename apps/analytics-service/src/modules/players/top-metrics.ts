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
export type Position = (typeof POSITIONS)[number];

export const DEFAULT_TOP_LIMIT = 10;
export const MAX_TOP_LIMIT = 50;

export interface PlayerTopItemDto {
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

export interface PlayerTopResponseDto {
  gameweek: number | null;
  metric: TopMetric;
  position: Position | null;
  items: PlayerTopItemDto[];
}
