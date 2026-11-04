import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PlayerSnapshotsService } from '../modules/snapshots/player-snapshots.service';
import { PlayersService } from '../modules/players/players.service';
import { SyncRunsService } from '../modules/sync-runs/sync-runs.service';
import { randomUUID } from 'crypto';
import { SnapshotReadyV1 } from '@app/contracts';
import { OutboxService } from '../events/outbox/outbox.service';
import { GameweeksService } from '../modules/gameweeks/gameweeks.service';

const ENDPOINT = 'daily-snapshot';

export interface DailySnapshotResult {
  runId: number;
  status: 'success' | 'skipped';
  count?: number;
}

/**
 * Суточный снимок ключевых полей игроков (цена, статус, шанс сыграть, владение).
 * Читает таблицу players, к FPL не обращается.
 * За сутки (UTC) делается один снимок; force=true заменяет сегодняшний.
 */
@Injectable()
export class DailySnapshotJob {
  private readonly logger = new Logger(DailySnapshotJob.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly syncRuns: SyncRunsService,
    private readonly players: PlayersService,
    private readonly snapshots: PlayerSnapshotsService,
    private readonly gameweeks: GameweeksService,
    private readonly outbox: OutboxService
  ) {}

  async run(opts: { force?: boolean } = {}): Promise<DailySnapshotResult> {
    const runId = await this.syncRuns.start(ENDPOINT);
    const correlationId = randomUUID();

    try {
      const now = new Date();
      const exists = await this.snapshots.hasForDay(now);

      if (exists && !opts.force) {
        await this.syncRuns.finish(runId, { status: 'skipped' });
        this.logger.log('Снимок за сегодня уже есть, пропуск');
        return { runId, status: 'skipped' };
      }

      const players = await this.players.getForSnapshot();
      if (players.length === 0) {
        throw new Error('Таблица players пуста: сначала выполните sync/bootstrap');
      }

      // Удаление старого и вставка нового в одной транзакции
      const count = await this.dataSource.transaction(async (manager) => {
        if (exists) await this.snapshots.deleteForDay(now, manager);
        const count = await this.snapshots.createFromPlayers(players, now, manager);
        await this.syncRuns.finish(runId, { status: 'success', itemsCount: count }, manager);
        await this.outbox.add(
          SnapshotReadyV1,
          {
            gameweek_number: await this.gameweeks.currentOrNextNumber(manager),
            updated: ['player_snapshots'],
            sync_run_id: runId,
          },
          manager,
          { correlationId },
        );
        return count;
      });

      this.logger.log(`Снимок готов: ${count} игроков`);
      return { runId, status: 'success', count };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.syncRuns.finish(runId, { status: 'failed', error: message });
      this.logger.error(`daily-snapshot упал: ${message}`);
      throw e;
    }
  }
}