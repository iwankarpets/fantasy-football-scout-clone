import { roundTo } from './types';

/** Очки сезона на миллион. nowCost в десятых (61 = 6.1). null при нулевой цене. */
export function calcPointsPerMillion(totalPoints: number, nowCost: number): number | null {
  if (nowCost <= 0) {
    return null;
  }
  return roundTo(totalPoints / (nowCost / 10));
}
