import { ApiPlayer } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { mapPlayer } from './players.mapper';

const now = new Date('2026-10-25T12:00:00Z');

function apiPlayer(overrides: Record<string, unknown> = {}): ApiPlayer {
  return {
    id: 1, code: 100, team: 2, element_type: 3,
    first_name: 'Mohamed', second_name: 'Salah', web_name: 'M.Salah',
    now_cost: 135, status: 'a',
    chance_of_playing_next_round: null, news: '', news_added: null,
    selected_by_percent: '45.3', form: '8.5', points_per_game: '7.2',
    total_points: 80, minutes: 700, starts: 8, goals_scored: 6, assists: 4,
    clean_sheets: 2, bps: 300,
    expected_goals: '5.12', expected_assists: '3.40', ict_index: '120.5',
    defensive_contribution: 10, ep_next: '6.1', ep_this: '5.0',
    cost_change_event: 0, cost_change_start: 2,
    transfers_in_event: 1000, transfers_out_event: 500,
    ...overrides,
  } as ApiPlayer;
}

describe('mapPlayer', () => {
  it('приводит строковые числа к number', () => {
    const p = mapPlayer(apiPlayer(), now);
    expect(p.selected_by_percent).toBe(45.3);
    expect(p.form).toBe(8.5);
    expect(p.expected_goals).toBe(5.12);
    expect(p.ict_index).toBe(120.5);
    expect(p.ep_next).toBe(6.1);
  });

  it('переживает null в nullable-полях', () => {
    const p = mapPlayer(apiPlayer({ ep_next: null, ep_this: null }), now);
    expect(p.chance_of_playing_next_round).toBeNull();
    expect(p.news_added).toBeNull();
    expect(p.ep_next).toBeNull();
    expect(p.ep_this).toBeNull();
  });

  it('парсит news_added и оставляет цену в десятых', () => {
    const p = mapPlayer(apiPlayer({ news_added: '2026-10-20T09:30:00Z' }), now);
    expect(p.news_added?.toISOString()).toBe('2026-10-20T09:30:00.000Z');
    expect(p.now_cost).toBe(135);
  });

  it('отсутствующий defensive_contribution даёт 0', () => {
    expect(mapPlayer(apiPlayer({ defensive_contribution: undefined }), now).defensive_contribution).toBe(0);
  });

  it('кладёт исходный объект в raw', () => {
    const api = apiPlayer({ some_new_field: 42 });
    expect(mapPlayer(api, now).raw).toBe(api);
  });
});
