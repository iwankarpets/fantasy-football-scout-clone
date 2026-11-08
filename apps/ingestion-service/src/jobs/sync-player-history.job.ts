import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { SnapshotReadyV1 } from '@app/contracts';
import { FplApiClient, sleep } from '../clients/fpl-api/fpl-api.client';
import { OutboxService } from '../events/outbox/outbox.service';
import { GameweeksService } from '../modules/gameweeks/gameweeks.service';
import { PlayerGameweekStatsService } from '../modules/player-gameweek-stats/player-gameweek-stats.service';
import { PlayersService } from '../modules/players/players.service';
import { SyncRunsService } from '../modules/sync-runs/sync-runs.service';

const ENDPOINT = 'element-summary';
/** Столько ошибок подряд считаем признаком блокировки или сбоя FPL и останавливаемся */
const MAX_CONSECUTIVE_FAILURES = 3;

export interface SyncPlayerHistoryOptions {
  /** Только эти игроки (для проверки на паре id или догрузки пропущенных) */
  playerIds?: number[];
  /** Первые N игроков: удобно для пробного запуска */
  limit?: number;
  /** true: только игроки с завершёнными матчами, которых ещё нет в player_gameweek_stats */
  onlyNewMatches?: boolean;
  /** Окно для onlyNewMatches, в днях (по умолчанию 3) */
  days?: number;
}

/**
 * Загрузка истории матчей игроков из element-summary/{id}.history
 * в player_gameweek_stats. Запросы идут по одному, с паузой.
 */
@Injectable()
export class SyncPlayerHistoryJob {
  private readonly logger = new Logger(SyncPlayerHistoryJob.name);
  private running = false;

  constructor(
    private readonly fpl: FplApiClient,
    private readonly dataSource: DataSource,
    private readonly syncRuns: SyncRunsService,
    private readonly players: PlayersService,
    private readonly stats: PlayerGameweekStatsService,
    private readonly outbox: OutboxService,
    private readonly gameweeks: GameweeksService,
  ) {}

  /** Для админки: запускает обход в фоне и сразу возвращает runId. */
  async start(opts: SyncPlayerHistoryOptions = {}): Promise<{ runId: number; status: 'started' }> {
    if (this.running) {
      throw new Error('sync-player-history уже выполняется');
    }
    this.running = true;

    try {
      const runId = await this.syncRuns.start(ENDPOINT);
      void this.execute(runId, opts).finally(() => {
        this.running = false;
      });
      return { runId, status: 'started' };
    } catch (e) {
      this.running = false;
      throw e;
    }
  }

  /** Для очереди: выполняет обход и ждёт окончания, чтобы concurrency: 1 защищал от наложения запросов. */
  async run(opts: SyncPlayerHistoryOptions = {}): Promise<{ runId: number }> {
    if (this.running) {
      throw new Error('sync-player-history уже выполняется');
    }
    this.running = true;
    try {
      const runId = await this.syncRuns.start(ENDPOINT);
      await this.execute(runId, opts);
      return { runId };
    } finally {
      this.running = false;
    }
  }

  private async resolveIds(opts: SyncPlayerHistoryOptions): Promise<number[]> {
    let ids: number[];
    if (opts.playerIds) {
      ids = opts.playerIds;
    } else if (opts.onlyNewMatches) {
      ids = await this.players.getIdsWithNewMatches(opts.days ?? 3);
    } else {
      ids = await this.players.getAllIds();
    }

    return opts.limit ? ids.slice(0, opts.limit) : ids;
  }

  /** Финальный статус и snapshot.ready (если что-то загрузили) в одной транзакции. */
  private async complete(
    runId: number,
    patch: { status: 'success' | 'failed'; itemsCount: number; error?: string },
    correlationId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.syncRuns.finish(runId, patch, manager);
      if (patch.itemsCount > 0) {
        await this.outbox.add(
          SnapshotReadyV1,
          {
            gameweek_number: await this.gameweeks.currentOrNextNumber(manager),
            updated: ['player_history'],
            sync_run_id: runId,
          },
          manager,
          { correlationId },
        );
      }
    });
  }

  private async execute(runId: number, opts: SyncPlayerHistoryOptions): Promise<void> {
    try {
      const correlationId = randomUUID();
      const ids = await this.resolveIds(opts);
      if (ids.length === 0) {
        this.logger.log('Нет игроков для загрузки истории');
      }

      let rows = 0;
      let consecutiveFailures = 0;
      let aborted = false;
      const failed: number[] = [];

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        try {
          const { data } = await this.fpl.getElementSummary(id);
          rows += await this.stats.upsertFromApi(data.history);
          consecutiveFailures = 0;
        } catch (e) {
          failed.push(id);
          consecutiveFailures++;
          this.logger.warn(`element-summary/${id}: ${e instanceof Error ? e.message : String(e)}`);
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            aborted = true;
            break;
          }
        }

        if ((i + 1) % 50 === 0) {
          this.logger.log(`Обработано ${i + 1}/${ids.length} игроков`);
        }
        await sleep(this.fpl.requestDelayMs);
      }

      if (aborted) {
        const error = `Остановлено: ${MAX_CONSECUTIVE_FAILURES} ошибок подряд. Не загружены: ${failed.join(', ')}`;
        await this.complete(runId, { status: 'failed', itemsCount: rows, error }, correlationId);
        this.logger.error(error);
      } else if (failed.length > 0) {
        const error = `Не загружены ${failed.length} из ${ids.length} игроков: ${failed.slice(0, 20).join(', ')}`;
        await this.complete(runId, { status: 'failed', itemsCount: rows, error }, correlationId);
        this.logger.error(error);
      } else {
        await this.complete(runId, { status: 'success', itemsCount: rows }, correlationId);
        this.logger.log(`Готово: ${ids.length} игроков, ${rows} строк`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.syncRuns.finish(runId, { status: 'failed', error: message });
      this.logger.error(`sync-player-history упал: ${message}`);
    }
  }
}
