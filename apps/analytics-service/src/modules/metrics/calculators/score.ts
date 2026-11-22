import { roundTo } from './types';

export type PositionCode = 'GKP' | 'DEF' | 'MID' | 'FWD';

export interface ScoreInput {
  playerId: number;
  position: PositionCode;
  form5: number | null;
  pointsPerMillion: number | null;
  xgiPer90: number | null;
  minutesReliability: number | null;
}

export interface ScoreResult {
  playerId: number;
  /** 0..100, null у игроков, которые не выходили на поле. */
  score: number | null;
  /** Место среди игроков своей позиции, 1 = лучший. */
  positionRank: number | null;
}

type Component = 'form5' | 'pointsPerMillion' | 'xgiPer90' | 'minutesReliability';

/** Веса компонентов по позициям, в каждой строке сумма равна 1. */
export const WEIGHTS: Record<PositionCode, Record<Component, number>> = {
  GKP: { form5: 0.4, pointsPerMillion: 0.2, xgiPer90: 0, minutesReliability: 0.4 },
  DEF: { form5: 0.35, pointsPerMillion: 0.2, xgiPer90: 0.1, minutesReliability: 0.35 },
  MID: { form5: 0.3, pointsPerMillion: 0.15, xgiPer90: 0.3, minutesReliability: 0.25 },
  FWD: { form5: 0.3, pointsPerMillion: 0.15, xgiPer90: 0.35, minutesReliability: 0.2 },
};

const COMPONENTS = Object.keys(WEIGHTS.MID) as Component[];

/** Перцентиль значения среди values (0..1), равные значения делят место пополам. */
function percentRank(value: number, values: readonly number[]): number {
  const less = values.filter((v) => v < value).length;
  const equal = values.filter((v) => v === value).length;
  return (less + 0.5 * equal) / values.length;
}

/**
 * Рейтинг считается внутри позиции: каждый компонент превращается в перцентиль
 * среди игроков той же позиции, затем берётся взвешенное среднее. Если у игрока
 * нет какого-то компонента (например, мало минут для xGI), его вес
 * перераспределяется на остальные. Игроки без формы (не играли) не получают
 * рейтинга и не участвуют в сравнении.
 */
export function computeScores(inputs: readonly ScoreInput[]): ScoreResult[] {
  const eligible = inputs.filter((p) => p.form5 !== null);
  const results = new Map<number, ScoreResult>(
    inputs.map((p) => [p.playerId, { playerId: p.playerId, score: null, positionRank: null }]),
  );

  const positions = new Set(eligible.map((p) => p.position));
  for (const position of positions) {
    const group = eligible.filter((p) => p.position === position);

    const pool = {} as Record<Component, number[]>;
    for (const c of COMPONENTS) {
      pool[c] = group.map((p) => p[c]).filter((v): v is number => v !== null);
    }

    const scored = group.map((p) => {
      let weighted = 0;
      let weightSum = 0;
      for (const c of COMPONENTS) {
        const value = p[c];
        const weight = WEIGHTS[position][c];
        if (value === null || weight === 0) {
          continue;
        }
        weighted += weight * percentRank(value, pool[c]);
        weightSum += weight;
      }
      return { playerId: p.playerId, score: weightSum > 0 ? (weighted / weightSum) * 100 : null };
    });

    scored
      .filter((s): s is { playerId: number; score: number } => s.score !== null)
      .sort((a, b) => b.score - a.score || a.playerId - b.playerId)
      .forEach((s, index) => {
        results.set(s.playerId, {
          playerId: s.playerId,
          score: roundTo(s.score, 2),
          positionRank: index + 1,
        });
      });
  }

  return inputs.map((p) => results.get(p.playerId)!);
}
