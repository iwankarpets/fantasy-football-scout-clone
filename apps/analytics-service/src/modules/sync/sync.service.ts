import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  IngestionApiClient,
  MAX_ROUND_SPAN,
} from '../../clients/ingestion-api/ingestion-api.client';
import { bulkUpsert } from './bulk.upsert';
import {
  ELEMENT_TYPES,
  FIXTURES,
  GAMEWEEKS,
  PLAYER_GAMEWEEK_STATS,
  PLAYERS,
  TEAMS,
} from './sync.tables';

export interface SyncScope {
  /** Справочники: типы позиций, команды, туры, игроки, матчи. */
  reference: boolean;
  /** История игроков по матчам. */
  history: boolean;
  /** Перезагрузить историю с 1-го тура, а не с последнего загруженного. */
  fullHistory?: boolean;
}

export interface SyncResult {
  reference?: Record<string, number>;
  history?: { rows: number; from: number | null; to: number | null };
  durationMs: number;
}

const REFERENCE_KEYS = ['teams', 'gameweeks', 'players', 'fixtures'];

/** Что синхронизировать по полю updated из события snapshot.ready. */
export function scopeFromUpdated(updated: readonly string[]): SyncScope {
  return {
    reference: REFERENCE_KEYS.some((k) => updated.includes(k)),
    history: updated.includes('player_history'),
  };
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  /** Синхронизации выполняются строго по очереди, чтобы не писать в одни таблицы параллельно. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly ds: DataSource,
    private readonly ingestion: IngestionApiClient,
  ) {}

  run(scope: SyncScope): Promise<SyncResult> {
    const next = this.queue.then(
      () => this.doRun(scope),
      () => this.doRun(scope),
    );
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async doRun(scope: SyncScope): Promise<SyncResult> {
    const started = Date.now();
    const result: SyncResult = { durationMs: 0 };

    // Сначала справочники: границы истории берутся из gameweeks_read.
    if (scope.reference) {
      result.reference = await this.syncReference();
    }
    if (scope.history) {
      result.history = await this.syncHistory(scope.fullHistory ?? false);
    }

    result.durationMs = Date.now() - started;
    this.logger.log(`sync finished: ${JSON.stringify(result)}`);
    return result;
  }

  /** Справочники грузятся целиком и пишутся одной транзакцией. */
  private async syncReference(): Promise<Record<string, number>> {
    const [elementTypes, teams, gameweeks, players, fixtures] = await Promise.all([
      this.ingestion.elementTypes(),
      this.ingestion.teams(),
      this.ingestion.gameweeks(),
      this.ingestion.players(),
      this.ingestion.fixtures(),
    ]);

    return this.ds.transaction(async (manager) => ({
      element_types: await bulkUpsert(manager, ELEMENT_TYPES, elementTypes),
      teams: await bulkUpsert(manager, TEAMS, teams),
      gameweeks: await bulkUpsert(manager, GAMEWEEKS, gameweeks),
      players: await bulkUpsert(manager, PLAYERS, players),
      fixtures: await bulkUpsert(manager, FIXTURES, fixtures),
    }));
  }

  /**
   * История идёт пачками по MAX_ROUND_SPAN туров. По умолчанию грузится с тура,
   * предшествующего последнему загруженному (на случай правок очков), до
   * последнего завершённого или текущего тура. Каждая пачка пишется своей
   * транзакцией, поэтому прерванная загрузка продолжится с того же места.
   */
  private async syncHistory(full: boolean): Promise<{
    rows: number;
    from: number | null;
    to: number | null;
  }> {
    const [{ upto }] = await this.ds.query(
      `SELECT max(id) AS upto FROM gameweeks_read WHERE finished OR is_current`,
    );
    if (upto === null) {
      return { rows: 0, from: null, to: null };
    }

    const [{ last }] = await this.ds.query(
      `SELECT max(round) AS last FROM player_gameweek_stats_read`,
    );
    const from: number = full || last === null ? 1 : Math.max(1, last - 1);
    if (from > upto) {
      return { rows: 0, from: null, to: null };
    }

    let rows = 0;
    for (let start = from; start <= upto; start += MAX_ROUND_SPAN) {
      const end = Math.min(upto, start + MAX_ROUND_SPAN - 1);
      const batch = await this.ingestion.playerStats(start, end);
      rows += await this.ds.transaction((manager) =>
        bulkUpsert(manager, PLAYER_GAMEWEEK_STATS, batch),
      );
    }
    return { rows, from, to: upto };
  }
}
