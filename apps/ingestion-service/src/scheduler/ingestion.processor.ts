import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DailySnapshotJob } from '../jobs/daily-snapshot.job';
import { SyncBootstrapJob } from '../jobs/sync-bootstrap.job';
import { SyncFixturesJob } from '../jobs/sync-fixtures.job';
import {
  INGESTION_QUEUE,
  JOB_DAILY_SNAPSHOT,
  JOB_SYNC_BOOTSTRAP,
  JOB_SYNC_FIXTURES,
} from './scheduler.constants';

/** concurrency: 1 → задачи идут строго по одной, запросы к FPL не накладываются. */
@Processor(INGESTION_QUEUE, { concurrency: 1 })
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private readonly bootstrap: SyncBootstrapJob,
    private readonly fixtures: SyncFixturesJob,
    private readonly snapshot: DailySnapshotJob,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    this.logger.log(`Задача ${job.name} (попытка ${job.attemptsMade + 1})`);
    switch (job.name) {
      case JOB_SYNC_BOOTSTRAP:
        return this.bootstrap.run();
      case JOB_SYNC_FIXTURES:
        return this.fixtures.run();
      case JOB_DAILY_SNAPSHOT:
        return this.snapshot.run();
      default:
        throw new Error(`Неизвестная задача: ${job.name}`);
    }
  }
}