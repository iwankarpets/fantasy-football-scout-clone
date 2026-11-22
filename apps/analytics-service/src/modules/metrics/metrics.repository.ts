import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { MatchRecord } from './calculators/types';
import { PlayerMetricsRow, PlayerSource } from './metrics.types';
import { bulkUpsert, TableSpec } from '../sync/bulk.upsert';

const PLAYER_METRICS: TableSpec = {
  table: 'player_metrics',
  pk: ['player_id', 'as_of_gameweek'],
  stampColumn: 'computed_at',
  columns: [
    'player_id integer',
    'as_of_gameweek integer',
    'form_3 numeric',
    'form_5 numeric',
    'avg_minutes_5 numeric',
    'minutes_reliability numeric',
    'points_per_million numeric',
    'xgi_per90_5 numeric',
    'ownership_trend numeric',
    'position_rank integer',
    'score numeric',
  ],
};

@Injectable()
export class MetricsRepository {
  constructor(private readonly ds: DataSource) {}

  /**
   * Тур, по который считаются метрики: последний завершённый, но не позже
   * последнего тура, для которого уже загружена история игроков. Так метрики
   * не считаются по недогруженным данным. null, если данных ещё нет.
   */
  async findAsOfGameweek(): Promise<number | null> {
    const [row] = await this.ds.query(`
      SELECT (SELECT max(id) FROM gameweeks_read WHERE finished) AS finished,
             (SELECT max(round) FROM player_gameweek_stats_read) AS loaded
    `);
    if (row.finished === null || row.loaded === null) {
      return null;
    }
    return Math.min(row.finished, row.loaded);
  }

  findPlayers(): Promise<PlayerSource[]> {
    return this.ds.query(`
      SELECT p.id, et.singular_name_short AS position, p.now_cost, p.total_points
      FROM players_read p
      JOIN element_types_read et ON et.id = p.element_type
    `);
  }

  /** История игроков до тура asOf включительно, сгруппированная по игроку. */
  async findHistory(asOf: number): Promise<Map<number, MatchRecord[]>> {
    // numeric приходит из pg строкой, поэтому xGI приводится к float8 прямо в запросе.
    const rows: Array<MatchRecord & { element: number }> = await this.ds.query(
      `
      SELECT element, round, fixture, minutes, total_points,
             expected_goal_involvements::float8 AS expected_goal_involvements,
             selected
      FROM player_gameweek_stats_read
      WHERE round <= $1
    `,
      [asOf],
    );

    const byPlayer = new Map<number, MatchRecord[]>();
    for (const { element, ...match } of rows) {
      const list = byPlayer.get(element);
      if (list) {
        list.push(match);
      } else {
        byPlayer.set(element, [match]);
      }
    }
    return byPlayer;
  }

  upsertMetrics(rows: readonly PlayerMetricsRow[]): Promise<number> {
    return this.ds.transaction((m) => bulkUpsert(m, PLAYER_METRICS, rows));
  }
}
