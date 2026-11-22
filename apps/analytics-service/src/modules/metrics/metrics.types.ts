/** Игрок из players_read в том виде, который нужен для расчёта метрик. */
export interface PlayerSource {
  id: number;
  /** GKP / DEF / MID / FWD (singular_name_short из element_types_read). */
  position: string;
  /** В десятых: 61 = 6.1 */
  now_cost: number;
  total_points: number;
}

/** Строка таблицы player_metrics. */
export interface PlayerMetricsRow {
  player_id: number;
  as_of_gameweek: number;
  form_3: number | null;
  form_5: number | null;
  avg_minutes_5: number | null;
  minutes_reliability: number | null;
  points_per_million: number | null;
  xgi_per90_5: number | null;
  ownership_trend: number | null;
  position_rank: number | null;
  score: number | null;
}

export interface RecalculateResult {
  as_of_gameweek: number | null;
  /** Сколько игроков записано. */
  players: number;
  /** Сколько из них получили рейтинг. */
  scored: number;
  duration_ms: number;
}
