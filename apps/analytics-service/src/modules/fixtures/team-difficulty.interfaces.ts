export interface GameweekLite {
  id: number;
  finished: boolean | null;
}

export interface FixtureLite {
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number | null;
  team_a_difficulty: number | null;
  finished: boolean | null;
  finished_provisional: boolean | null;
}

export interface TeamDifficultyRow {
  team_id: number;
  /** Первый тур окна: первый незавершённый тур. */
  as_of_gameweek: number;
  horizon: number;
  /** Средняя сложность матчей окна (1 легко, 5 тяжело); null, если матчей нет. */
  difficulty: number | null;
  matches_count: number;
  has_double: boolean;
  has_blank: boolean;
}
