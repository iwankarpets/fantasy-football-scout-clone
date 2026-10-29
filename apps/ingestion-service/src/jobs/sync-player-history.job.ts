import { Injectable, Logger } from '@nestjs/common';
import { FplApiClient, sleep } from '../clients/fpl-api/fpl-api.client';
import { PlayerGameweekStatsService } from '../modules/player-gameweek-stats/player-gameweek-stats.service';
import { PlayersService } from '../modules/players/players.service';
import { SyncRunsService } from '../modules/sync-runs/sync-runs.service';

const ENDPOINT = 'element-summary';
/** Столько ошибок подряд считаем признаком блокировки или сбоя FPL и останавливаемся */
const MAX_CONSECUTIVE_FAILURES = 5;

export interface SyncPlayerHistoryOptions {
  /** Только эти игроки (для проверки на паре id) */
  playerIds?: number[];
  /** Первые N игроков: удобно для пробного запуска */
  limit?: number;
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
    private readonly syncRuns: SyncRunsService,
    private readonly players: PlayersService,
    private readonly stats: PlayerGameweekStatsService,
  ) {}

  /** Создаёт запись в sync_runs, запускает обход в фоне и сразу возвращает runId. */
  async start(opts: SyncPlayerHistoryOptions = {}): Promise<{ runId: number; status: 'started' }> {
    if (this.running) throw new Error('sync-player-history уже выполняется');
    this.running = true;

    const runId = await this.syncRuns.start(ENDPOINT);
    void this.execute(runId, opts).finally(() => {
      this.running = false;
    });
    return { runId, status: 'started' };
  }

  private async execute(runId: number, opts: SyncPlayerHistoryOptions): Promise<void> {
    try {
      let ids = opts.playerIds ?? (await this.players.getAllIds());
      if (opts.limit) ids = ids.slice(0, opts.limit);

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

        if ((i + 1) % 50 === 0) this.logger.log(`Обработано ${i + 1}/${ids.length} игроков`);
        await sleep(this.fpl.requestDelayMs);
      }

      if (aborted) {
        const error = `Остановлено: ${MAX_CONSECUTIVE_FAILURES} ошибок подряд. Не загружены: ${failed.join(', ')}`;
        await this.syncRuns.finish(runId, { status: 'failed', itemsCount: rows, error });
        this.logger.error(error);
      } else if (failed.length > 0) {
        const error = `Не загружены ${failed.length} из ${ids.length} игроков: ${failed.slice(0, 20).join(', ')}`;
        await this.syncRuns.finish(runId, { status: 'failed', itemsCount: rows, error });
        this.logger.error(error);
      } else {
        await this.syncRuns.finish(runId, { status: 'success', itemsCount: rows });
        this.logger.log(`Готово: ${ids.length} игроков, ${rows} строк`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.syncRuns.finish(runId, { status: 'failed', error: message });
      this.logger.error(`sync-player-history упал: ${message}`);
    }
  }
}