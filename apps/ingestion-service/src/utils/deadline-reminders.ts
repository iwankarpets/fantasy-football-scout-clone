/** Пороги напоминаний в часах, от большего к меньшему. */
export const REMINDER_THRESHOLD_HOURS = [24, 3] as const;

/**
 * Какое напоминание сейчас актуально: наименьший порог, в который мы уже вошли.
 * - 23.9 ч до дедлайна: 24
 * - 2.9 ч: 3 (напоминание «за 24» к этому моменту уже устарело)
 * - сервис был выключен и поднялся за 2 ч до дедлайна: только 3, без запоздалого «за 24»
 * - дедлайн прошёл или порог ещё не наступил: null
 */
export function pickReminderThreshold(
  nowEpochSec: number,
  deadlineEpochSec: number,
  thresholds: readonly number[] = REMINDER_THRESHOLD_HOURS,
): number | null {
  const hoursLeft = (deadlineEpochSec - nowEpochSec) / 3600;
  if (hoursLeft <= 0) {
    return null;
  }

  const reached = thresholds.filter((t) => hoursLeft <= t);
  return reached.length > 0 ? Math.min(...reached) : null;
}

export function deadlineDedupKey(
  gameweek: number,
  deadlineEpochSec: number,
  hours: number,
): string {
  return `deadline:${gameweek}:${deadlineEpochSec}:${hours}`;
}
