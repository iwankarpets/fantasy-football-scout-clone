import { TopMetric, TopPosition } from '../../clients/analytics-api/analytics-api.types';

const POSITION_ALIASES: Record<string, TopPosition> = {
  gkp: 'GKP',
  gk: 'GKP',
  вр: 'GKP',
  def: 'DEF',
  d: 'DEF',
  защ: 'DEF',
  mid: 'MID',
  m: 'MID',
  пз: 'MID',
  fwd: 'FWD',
  fw: 'FWD',
  f: 'FWD',
  нап: 'FWD',
};

const METRIC_ALIASES: Record<string, TopMetric> = {
  score: 'score',
  рейтинг: 'score',
  form: 'form_5',
  форма: 'form_5',
  form5: 'form_5',
  form3: 'form_3',
  value: 'points_per_million',
  ppm: 'points_per_million',
  ценность: 'points_per_million',
  xgi: 'xgi_per90_5',
  minutes: 'minutes_reliability',
  минуты: 'minutes_reliability',
  ownership: 'ownership_trend',
  own: 'ownership_trend',
  владение: 'ownership_trend',
};

export const DEFAULT_TOP_LIMIT = 10;
export const MAX_TOP_LIMIT = 15; // таблица должна помещаться в одно сообщение

export type ParsedTopArgs =
  | { ok: true; metric: TopMetric; position?: TopPosition; limit: number }
  | { ok: false; problem: string };

/** «», «mid», «form mid», «xgi fwd 5»: порядок слов не важен. */
export function parseTopArgs(raw: string): ParsedTopArgs {
  let metric: TopMetric = 'score';
  let position: TopPosition | undefined;
  let limit = DEFAULT_TOP_LIMIT;

  for (const token of raw.toLowerCase().split(/\s+/).filter(Boolean)) {
    if (/^\d+$/.test(token)) {
      const n = Number(token);
      if (n < 1 || n > MAX_TOP_LIMIT) {
        return { ok: false, problem: `Количество игроков: от 1 до ${MAX_TOP_LIMIT}.` };
      }
      limit = n;
    } else if (token in POSITION_ALIASES) {
      position = POSITION_ALIASES[token];
    } else if (token in METRIC_ALIASES) {
      metric = METRIC_ALIASES[token];
    } else {
      return { ok: false, problem: `Не понял «${token}».` };
    }
  }
  return { ok: true, metric, position, limit };
}

export const TOP_USAGE =
  'Использование: /top [метрика] [позиция] [число]\n' +
  'Метрики: score, form, form3, value, xgi, minutes, ownership\n' +
  'Позиции: gkp, def, mid, fwd\n' +
  'Примеры: /top, /top mid, /top form fwd 5';
