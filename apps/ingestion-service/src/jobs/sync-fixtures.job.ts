import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FplApiClient } from '../clients/fpl-api/fpl-api.client';
import { FixturesService } from '../modules/fixtures/fixtures.service';
import { SyncRunsService } from '../modules/sync-runs/sync-runs.service';
import { randomUUID } from 'crypto';
import { SnapshotReadyV1 } from '@app/contracts';
import { OutboxService } from '../events/outbox/outbox.service';
import { GameweeksService } from '../modules/gameweeks/gameweeks.service';

const ENDPOINT = 'fixtures';

export interface SyncFixturesResult {
  runId: number;
  status: 'success' | 'skipped';
  count?: number;
}

/**
 * Loading /fixtures/: matches, score, kickoff time, difficulty for each team.
 * Later, this job will be called by a BullMQ processor on a schedule.
 */
@Injectable()
export class SyncFixturesJob {
  private readonly logger = new Logger(SyncFixturesJob.name);

  constructor(
    private readonly fpl: FplApiClient,
    private readonly dataSource: DataSource,
    private readonly syncRuns: SyncRunsService,
    private readonly fixtures: FixturesService,
    private readonly outbox: OutboxService,
    private readonly gameweeks: GameweeksService,
  ) {}

  async run(opts: { force?: boolean } = {}): Promise<SyncFixturesResult> {
    const runId = await this.syncRuns.start(ENDPOINT);
    let hash: string | undefined;
    const correlationId = randomUUID();

    try {
      const response = await this.fpl.getFixtures();
      hash = response.hash;

      if (!opts.force && hash === (await this.syncRuns.lastSuccessHash(ENDPOINT))) {
        await this.syncRuns.finish(runId, { status: 'skipped', payloadHash: hash });
        this.logger.log(`Response has not changed (hash ${hash.slice(0, 8)}), sync skipped`);
        return { runId, status: 'skipped' };
      }

      const count = await this.dataSource.transaction(async (manager) => {
        const count = await this.fixtures.upsertFromApi(response.data, manager);
        await this.syncRuns.finish(
          runId,
          { status: 'success', itemsCount: count, payloadHash: hash },
          manager,
        );
        await this.outbox.add(
          SnapshotReadyV1,
          {
            gameweek_number: await this.gameweeks.currentOrNextNumber(manager),
            updated: ['fixtures'],
            sync_run_id: runId,
          },
          manager,
          { correlationId },
        );
        return count;
      });

      this.logger.log(`Done: ${count} matches`);
      return { runId, status: 'success', count };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.syncRuns.finish(runId, { status: 'failed', error: message, payloadHash: hash });
      this.logger.error(`sync-fixtures failed: ${message}`);
      throw e;
    }
  }
}
