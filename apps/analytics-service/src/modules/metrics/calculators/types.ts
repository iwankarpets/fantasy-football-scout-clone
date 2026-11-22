/**
 * Одна строка истории игрока: один матч его команды.
 * Минуты 0 означают, что игрок в заявку попал, но не играл (или вообще не выходил).
 * Числа уже приведены к number: из Postgres numeric приходит строкой,
 * поэтому приведение делает слой доступа к данным, а не формулы.
 */
export interface MatchRecord {
  round: number;
  fixture: number;
  minutes: number;
  total_points: number;
  expected_goal_involvements: number;
  selected: number;
}

/** Окно по умолчанию для «последних матчей». */
export const RECENT_WINDOW = 5;

/** Матчи от свежих к старым. Внутри спаренного тура порядок по id матча. */
export function recentMatches(history: readonly MatchRecord[]): MatchRecord[] {
  return [...history].sort((a, b) => b.round - a.round || b.fixture - a.fixture);
}

export function sum(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

export function roundTo(value: number, digits = 3): number {
  const k = 10 ** digits;
  return Math.round(value * k) / k;
}
