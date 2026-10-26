import { Player } from '../../database/entities/player.entity';
import { ApiPlayer } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { toDate, toNumber } from '../../utils/parse';

/**
 * Объект API -> строка players.
 * Строковые числа приводятся к number; null допустим только там, где колонка nullable.
 * Готовые *_per_90 из elements не пересчитываем и не храним (они лежат в raw).
 */
export function mapPlayer(api: ApiPlayer, now: Date): Player {
  return {
    id: api.id,
    code: api.code,
    team: api.team,
    element_type: api.element_type,
    first_name: api.first_name,
    second_name: api.second_name,
    web_name: api.web_name,
    now_cost: api.now_cost,
    status: api.status,
    chance_of_playing_next_round: api.chance_of_playing_next_round ?? null,
    news: api.news ?? '',
    news_added: toDate(api.news_added),
    selected_by_percent: toNumber(api.selected_by_percent) ?? 0,
    form: toNumber(api.form) ?? 0,
    points_per_game: toNumber(api.points_per_game) ?? 0,
    total_points: api.total_points,
    minutes: api.minutes,
    starts: api.starts,
    goals_scored: api.goals_scored,
    assists: api.assists,
    clean_sheets: api.clean_sheets,
    bps: api.bps,
    expected_goals: toNumber(api.expected_goals) ?? 0,
    expected_assists: toNumber(api.expected_assists) ?? 0,
    ict_index: toNumber(api.ict_index) ?? 0,
    defensive_contribution: api.defensive_contribution ?? 0,
    ep_next: toNumber(api.ep_next),
    ep_this: toNumber(api.ep_this),
    cost_change_event: api.cost_change_event,
    cost_change_start: api.cost_change_start,
    transfers_in_event: api.transfers_in_event,
    transfers_out_event: api.transfers_out_event,
    raw: api,
    updated_at: now,
  };
}
