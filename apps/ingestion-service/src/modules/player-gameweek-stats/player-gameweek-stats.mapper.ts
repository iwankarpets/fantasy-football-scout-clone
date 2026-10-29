import { ApiFplElementHistoryItem } from '../../clients/fpl-api/schemas/element-summary.schema';
import { PlayerGameweekStats } from '../../database/entities/player-gameweek-stats.entity';

/** id не заполняем: его выдаёт база (identity). */
export type PlayerGameweekStatsRow = Omit<PlayerGameweekStats, 'id'>;

export function mapPlayerGameweekStats(api: ApiFplElementHistoryItem, now: Date): PlayerGameweekStatsRow {
  return {
    element: api.element,
    fixture: api.fixture,
    round: api.round,
    opponent_team: api.opponent_team,
    was_home: api.was_home,
    minutes: api.minutes,
    starts: api.starts,
    goals_scored: api.goals_scored,
    assists: api.assists,
    clean_sheets: api.clean_sheets,
    goals_conceded: api.goals_conceded,
    saves: api.saves,
    bonus: api.bonus,
    bps: api.bps,
    yellow_cards: api.yellow_cards,
    red_cards: api.red_cards,
    total_points: api.total_points,
    expected_goals: Number(api.expected_goals),
    expected_assists: Number(api.expected_assists),
    expected_goal_involvements: Number(api.expected_goal_involvements),
    expected_goals_conceded: Number(api.expected_goals_conceded),
    value: api.value,
    selected: api.selected,
    transfers_in: api.transfers_in,
    transfers_out: api.transfers_out,
    transfers_balance: api.transfers_balance,
    updated_at: now,
  };
}