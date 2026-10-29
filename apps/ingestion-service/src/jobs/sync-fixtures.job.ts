import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FplApiClient } from '../clients/fpl-api/fpl-api.client';
import { FixturesService } from '../modules/fixtures/fixtures.service';
import { SyncRunsService } from '../modules/sync-runs/sync-runs.service';

const ENDPOINT = 'fixtures';

export interface SyncFixturesResult {
  runId: number;
  status: 'success' | 'skipped';
  count?: number;
}

/**
 * Загрузка /fixtures/: матчи, счёт, время начала, сложность для каждой команды.
 * Позже эту джобу вызовет BullMQ-процессор по расписанию.
 */
@Injectable()
export class SyncFixturesJob {
  private readonly logger = new Logger(SyncFixturesJob.name);

  constructor(
    private readonly fpl: FplApiClient,
    private readonly dataSource: DataSource,
    private readonly syncRuns: SyncRunsService,
    private readonly fixtures: FixturesService,
  ) {}

  async run(opts: { force?: boolean } = {}): Promise<SyncFixturesResult> {
    const runId = await this.syncRuns.start(ENDPOINT);
    let hash: string | undefined;

    try {
      const response = await this.fpl.getFixtures();
      hash = response.hash;

      if (!opts.force && hash === (await this.syncRuns.lastSuccessHash(ENDPOINT))) {
        await this.syncRuns.finish(runId, { status: 'skipped', payloadHash: hash });
        this.logger.log(`Ответ не изменился (хэш ${hash.slice(0, 8)}), загрузка пропущена`);
        return { runId, status: 'skipped' };
      }

      // В транзакции, чтобы оба чанка upsertInChunks откатились вместе при ошибке
      const count = await this.dataSource.transaction((manager) =>
        this.fixtures.upsertFromApi(response.data, manager),
      );

      await this.syncRuns.finish(runId, { status: 'success', itemsCount: count, payloadHash: hash });
      this.logger.log(`Готово: ${count} матчей`);
      return { runId, status: 'success', count };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.syncRuns.finish(runId, { status: 'failed', error: message, payloadHash: hash });
      this.logger.error(`sync-fixtures упал: ${message}`);
      throw e;
    }
  }
}