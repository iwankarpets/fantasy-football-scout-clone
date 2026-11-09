import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** Сколько дней хранить уже отправленные события. */
export const OUTBOX_RETENTION_DAYS = 7;
/** События с dedup_key хранятся дольше: их строка защищает от повторной отправки. */
export const OUTBOX_DEDUP_RETENTION_DAYS = 30;

export interface OutboxCleanupResult {
  deleted: number;
  deletedWithDedupKey: number;
}

/** Работает только по базе. Неопубликованные строки не трогает никогда. */
@Injectable()
export class OutboxCleanupJob {
  private readonly logger = new Logger(OutboxCleanupJob.name);

  constructor(private readonly dataSource: DataSource) {}

  async run(
    opts: { retentionDays?: number; dedupRetentionDays?: number } = {},
  ): Promise<OutboxCleanupResult> {
    const retentionDays = opts.retentionDays ?? OUTBOX_RETENTION_DAYS;
    const dedupRetentionDays = opts.dedupRetentionDays ?? OUTBOX_DEDUP_RETENTION_DAYS;

    const deleted = await this.deletePublished(retentionDays, false);
    const deletedWithDedupKey = await this.deletePublished(dedupRetentionDays, true);

    this.logger.log(`Outbox is cleared: ${deleted} outboxes, ${deletedWithDedupKey} с dedup_key`);
    return { deleted, deletedWithDedupKey };
  }

  private async deletePublished(days: number, withDedupKey: boolean): Promise<number> {
    const dedupCondition = withDedupKey ? 'dedup_key IS NOT NULL' : 'dedup_key IS NULL';
    const rows: { n: number }[] = await this.dataSource.query(
      `WITH del AS (
         DELETE FROM outbox_events
          WHERE published_at IS NOT NULL
            AND published_at < now() - make_interval(days => $1::int)
            AND ${dedupCondition}
          RETURNING 1
       )
       SELECT count(*)::int AS n FROM del`,
      [days],
    );
    return rows[0].n;
  }
}
