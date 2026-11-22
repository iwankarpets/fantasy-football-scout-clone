import { MatchRecord, RECENT_WINDOW, recentMatches, roundTo, sum } from './types';

/**
 * Ожидаемое участие в голах на 90 минут по последним n матчам.
 * Если суммарных минут меньше minMinutes, значение слишком шумное: null.
 * Нормирование на 90 минут нужно, чтобы игрок с полными матчами не выигрывал
 * у выходящего на замену только за счёт времени на поле.
 */
export function calcXgiPer90(
  history: readonly MatchRecord[],
  n: number = RECENT_WINDOW,
  minMinutes = 90,
): number | null {
  const recent = recentMatches(history).slice(0, n);
  const minutes = sum(recent.map((m) => m.minutes));
  if (minutes < minMinutes) {
    return null;
  }
  return roundTo((sum(recent.map((m) => m.expected_goal_involvements)) / minutes) * 90);
}
