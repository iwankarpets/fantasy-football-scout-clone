import { TeamDifficultyItem } from '../../clients/analytics-api/analytics-api.types';
import { escapeHtml } from './text';

export function formatFixtures(items: TeamDifficultyItem[]): string {
  if (items.length === 0) {
    return 'Данных по календарю пока нет, попробуйте позже.';
  }
  const { horizon, as_of_gameweek } = items[0];

  const header = `${'Ком'.padEnd(3)} ${'Слож'.padStart(5)} ${'Матч'.padStart(4)}`;
  const lines = items.map((t) => {
    const flags = [t.has_double ? 'DGW' : '', t.has_blank ? 'BGW' : ''].filter(Boolean).join(' ');
    return `${t.team_short_name.padEnd(3)} ${(t.difficulty === null ? '-' : t.difficulty.toFixed(2)).padStart(5)} ${String(t.matches_count).padStart(4)} ${flags}`.trimEnd();
  });

  const word = horizon === 3 ? 'тура' : 'туров';
  const title = `Календарь на ${horizon} ${word}, начиная с тура ${as_of_gameweek}`;
  const legend =
    'Сложность: 1 легко, 5 тяжело. Сверху лёгкий календарь. DGW двойной тур, BGW есть тур без матча.';
  return `<b>${escapeHtml(title)}</b>\n<pre>${escapeHtml([header, ...lines].join('\n'))}</pre>\n${escapeHtml(legend)}`;
}
