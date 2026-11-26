import { PlayerTopResponse, TopMetric } from '../../clients/analytics-api/analytics-api.types';
import { cut, escapeHtml } from './text';

export const METRIC_LABELS: Record<TopMetric, string> = {
  score: 'рейтинг',
  form_3: 'форма за 3 тура',
  form_5: 'форма за 5 туров',
  avg_minutes_5: 'средние минуты (5 туров)',
  minutes_reliability: 'надёжность минут',
  points_per_million: 'очки на миллион',
  xgi_per90_5: 'xGI на 90 (5 туров)',
  ownership_trend: 'тренд владения',
};

/** a: играет, d: сомнителен, i/s/u: не сыграет. */
const STATUS_MARK: Record<string, string> = { a: ' ', d: '!', i: 'X', s: 'X', u: 'X' };

function formatValue(metric: TopMetric, v: number): string {
  // TODO: проверь, что minutes_reliability хранится долей 0..1
  if (metric === 'minutes_reliability') {
    return `${Math.round(v * 100)}%`;
  }
  if (metric === 'ownership_trend') {
    return (v > 0 ? '+' : '') + v.toFixed(2);
  }
  return v.toFixed(2);
}

export function formatTop(res: PlayerTopResponse): string {
  if (res.gameweek === null || res.items.length === 0) {
    return 'Данных пока нет, попробуйте позже.';
  }

  const header = `${'#'.padStart(2)} ${'Игрок'.padEnd(12)} ${'Ком'.padEnd(3)} ${'Цена'.padStart(4)} ${'Знач'.padStart(6)}`;
  const lines = res.items.map((p, i) => {
    const mark = STATUS_MARK[p.status] ?? ' ';
    return [
      String(i + 1).padStart(2),
      cut(p.web_name, 12).padEnd(12),
      p.team_short_name.padEnd(3),
      (p.now_cost / 10).toFixed(1).padStart(4),
      formatValue(res.metric, p.value).padStart(6) + mark,
    ].join(' ');
  });

  const pos = res.position ? ` ${res.position}` : '';
  const title = `Топ${pos}: ${METRIC_LABELS[res.metric]}, данные на тур ${res.gameweek}`;
  const legend = '! сомнителен, X не сыграет';
  return `<b>${escapeHtml(title)}</b>\n<pre>${escapeHtml([header, ...lines].join('\n'))}</pre>\n${escapeHtml(legend)}`;
}
