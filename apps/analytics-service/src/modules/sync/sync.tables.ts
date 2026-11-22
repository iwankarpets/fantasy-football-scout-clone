/**
 * Описание таблиц-копий: имя таблицы, колонки с типами и первичный ключ.
 * Имена колонок совпадают с полями ответов /internal/* в ingestion-service.
 * Значения подставляются в SQL строкой, поэтому приходят только из этих констант,
 * но никогда из внешнего ввода.
 */
export interface TableSpec {
  table: string;
  /** Колонки в формате «имя тип». */
  columns: string[];
  /** Колонки первичного ключа (для ON CONFLICT). */
  pk: string[];
}

export const ELEMENT_TYPES: TableSpec = {
  table: 'element_types_read',
  pk: ['id'],
  columns: [
    'id integer',
    'singular_name varchar',
    'singular_name_short varchar',
    'plural_name varchar',
    'plural_name_short varchar',
    'squad_select integer',
    'squad_min_play integer',
    'squad_max_play integer',
    'element_count integer',
  ],
};

export const TEAMS: TableSpec = {
  table: 'teams_read',
  pk: ['id'],
  columns: [
    'id integer',
    'code integer',
    'name varchar',
    'short_name varchar',
    'strength_overall_home integer',
    'strength_overall_away integer',
    'strength_attack_home integer',
    'strength_attack_away integer',
    'strength_defence_home integer',
    'strength_defence_away integer',
    'played integer',
    'win integer',
    'draw integer',
    'loss integer',
    'points integer',
    'position integer',
    'form numeric',
    'strength integer',
  ],
};

export const PLAYERS: TableSpec = {
  table: 'players_read',
  pk: ['id'],
  columns: [
    'id integer',
    'code integer',
    'team integer',
    'element_type integer',
    'first_name varchar',
    'second_name varchar',
    'web_name varchar',
    'now_cost integer',
    'status varchar',
    'chance_of_playing_next_round integer',
    'news text',
    'news_added timestamptz',
    'selected_by_percent numeric',
    'form numeric',
    'points_per_game numeric',
    'total_points integer',
    'minutes integer',
    'starts integer',
    'goals_scored integer',
    'assists integer',
    'clean_sheets integer',
    'bps integer',
    'expected_goals numeric',
    'expected_assists numeric',
    'ict_index numeric',
    'defensive_contribution numeric',
    'ep_next numeric',
    'ep_this numeric',
    'cost_change_event integer',
    'cost_change_start integer',
    'transfers_in_event integer',
    'transfers_out_event integer',
  ],
};

export const GAMEWEEKS: TableSpec = {
  table: 'gameweeks_read',
  pk: ['id'],
  columns: [
    'id integer',
    'name varchar',
    'deadline_time timestamptz',
    'deadline_time_epoch integer',
    'finished boolean',
    'data_checked boolean',
    'is_previous boolean',
    'is_current boolean',
    'is_next boolean',
    'release_time timestamptz',
    'average_entry_score integer',
    'highest_score integer',
    'top_element integer',
    'most_selected integer',
    'most_transferred_in integer',
    'most_captained integer',
    'most_vice_captained integer',
  ],
};

export const FIXTURES: TableSpec = {
  table: 'fixtures_read',
  pk: ['id'],
  columns: [
    'id integer',
    'code integer',
    'event integer',
    'team_h integer',
    'team_a integer',
    'team_h_score integer',
    'team_a_score integer',
    'kickoff_time timestamptz',
    'team_h_difficulty integer',
    'team_a_difficulty integer',
    'started boolean',
    'finished boolean',
    'finished_provisional boolean',
    'minutes integer',
  ],
};

export const PLAYER_GAMEWEEK_STATS: TableSpec = {
  table: 'player_gameweek_stats_read',
  pk: ['element', 'fixture'],
  columns: [
    'element integer',
    'fixture integer',
    'round integer',
    'opponent_team integer',
    'was_home boolean',
    'minutes integer',
    'starts integer',
    'goals_scored integer',
    'assists integer',
    'clean_sheets integer',
    'goals_conceded integer',
    'saves integer',
    'bonus integer',
    'bps integer',
    'yellow_cards integer',
    'red_cards integer',
    'total_points integer',
    'expected_goals numeric',
    'expected_assists numeric',
    'expected_goal_involvements numeric',
    'expected_goals_conceded numeric',
    'value integer',
    'selected integer',
    'transfers_in integer',
    'transfers_out integer',
    'transfers_balance integer',
  ],
};
