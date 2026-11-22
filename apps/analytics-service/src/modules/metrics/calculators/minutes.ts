import { MatchRecord, RECENT_WINDOW, recentMatches, roundTo, sum } from './types';

/** Средние минуты за последние n матчей команды, нули считаются. null без истории. */
export function calcAvgMinutes(
  history: readonly MatchRecord[],
  n: number = RECENT_WINDOW,
): number | null {
  const recent = recentMatches(history).slice(0, n);
  if (recent.length === 0) {
    return null;
  }
  return roundTo(sum(recent.map((m) => m.minutes)) / recent.length);
}

/** Доля матчей из последних n, где игрок провёл не меньше threshold минут (0..1). */
export function calcMinutesReliability(
  history: readonly MatchRecord[],
  n: number = RECENT_WINDOW,
  threshold = 60,
): number | null {
  const recent = recentMatches(history).slice(0, n);
  if (recent.length === 0) {
    return null;
  }
  return roundTo(recent.filter((m) => m.minutes >= threshold).length / recent.length);
}
