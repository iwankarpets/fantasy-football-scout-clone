import { MatchRecord, recentMatches, roundTo, sum } from './types';

/**
 * Форма: средние очки за матч по последним n матчам, в которых игрок выходил
 * на поле (minutes > 0). Недоигранные окна считаются по тому, что есть.
 * Риск ротации отражает не форма, а надёжность минут. null, если игрок не играл.
 */
export function calcForm(history: readonly MatchRecord[], n: number): number | null {
  const played = recentMatches(history)
    .filter((m) => m.minutes > 0)
    .slice(0, n);
  if (played.length === 0) {
    return null;
  }
  return roundTo(sum(played.map((m) => m.total_points)) / played.length);
}
