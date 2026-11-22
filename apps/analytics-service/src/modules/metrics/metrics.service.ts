import { Injectable, Logger } from '@nestjs/common';
import { calcForm } from './calculators/form';
import { calcAvgMinutes, calcMinutesReliability } from './calculators/minutes';
import { calcOwnershipTrend } from './calculators/ownership-trend';
import { calcPointsPerMillion } from './calculators/points-per-million';
import { computeScores, PositionCode, ScoreInput, WEIGHTS } from './calculators/score';
import { PlayerMetricsRow, RecalculateResult } from './metrics.types';
import { MetricsRepository } from './metrics.repository';
import { calcXgiPer90 } from './calculators/xGi';

function isPositionCode(value: string): value is PositionCode {
  return value in WEIGHTS;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  /** Пересчёты идут строго по очереди: два параллельных писали бы в одни строки. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly repository: MetricsRepository) {}

  recalculate(): Promise<RecalculateResult> {
    const next = this.queue.then(
      () => this.doRecalculate(),
      () => this.doRecalculate(),
    );
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async doRecalculate(): Promise<RecalculateResult> {
    const started = Date.now();
    const asOf = await this.repository.findAsOfGameweek();
    if (asOf === null) {
      this.logger.warn('no finished gameweek with loaded history yet, metrics skipped');
      return { as_of_gameweek: null, players: 0, scored: 0, duration_ms: Date.now() - started };
    }

    const [players, history] = await Promise.all([
      this.repository.findPlayers(),
      this.repository.findHistory(asOf),
    ]);

    // Метрики игрока по его истории. Рейтинг считается позже, сразу для всех:
    // перцентили строятся по всей позиции.
    const partial = players.flatMap((player) => {
      if (!isPositionCode(player.position)) {
        return [];
      }
      const matches = history.get(player.id) ?? [];
      return [
        {
          player_id: player.id,
          position: player.position,
          form_3: calcForm(matches, 3),
          form_5: calcForm(matches, 5),
          avg_minutes_5: calcAvgMinutes(matches),
          minutes_reliability: calcMinutesReliability(matches),
          points_per_million: calcPointsPerMillion(player.total_points, player.now_cost),
          xgi_per90_5: calcXgiPer90(matches),
          ownership_trend: calcOwnershipTrend(matches),
        },
      ];
    });

    const scoreInputs: ScoreInput[] = partial.map((p) => ({
      playerId: p.player_id,
      position: p.position,
      form5: p.form_5,
      pointsPerMillion: p.points_per_million,
      xgiPer90: p.xgi_per90_5,
      minutesReliability: p.minutes_reliability,
    }));
    const scores = new Map(computeScores(scoreInputs).map((s) => [s.playerId, s]));

    const rows: PlayerMetricsRow[] = partial.map(({ position: _position, ...metrics }) => ({
      ...metrics,
      as_of_gameweek: asOf,
      score: scores.get(metrics.player_id)?.score ?? null,
      position_rank: scores.get(metrics.player_id)?.positionRank ?? null,
    }));

    await this.repository.upsertMetrics(rows);

    const result: RecalculateResult = {
      as_of_gameweek: asOf,
      players: rows.length,
      scored: rows.filter((r) => r.score !== null).length,
      duration_ms: Date.now() - started,
    };
    this.logger.log(`metrics recalculated: ${JSON.stringify(result)}`);
    return result;
  }
}
