import { MatchRecord, roundTo } from './types';

/**
 * Относительное изменение числа владельцев между последним туром игрока
 * и туром на roundsBack раньше (0.1 = +10%). Если истории не хватает или
 * база нулевая, возвращает null.
 */
export function calcOwnershipTrend(history: readonly MatchRecord[], roundsBack = 3): number | null {
  if (history.length === 0) {
    return null;
  }

  const latestRound = Math.max(...history.map((m) => m.round));
  const latest = history.find((m) => m.round === latestRound);
  const olderOrEqual = history.filter((m) => m.round <= latestRound - roundsBack);
  if (!latest || olderOrEqual.length === 0) {
    return null;
  }

  const base = olderOrEqual.reduce((a, b) => (b.round > a.round ? b : a));
  if (base.selected <= 0) {
    return null;
  }
  return roundTo((latest.selected - base.selected) / base.selected);
}
