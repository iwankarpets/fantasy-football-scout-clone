import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * dedup_key нужен событиям, которые генерирует периодическая джоба (deadline_approaching).
 * Обычные события пишутся с NULL: в Postgres NULL в уникальном индексе не конфликтуют.
 */
export class AddOutboxDedupKey1792886400008 implements MigrationInterface {
  name = 'AddOutboxDedupKey1792886400008';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE outbox_events ADD COLUMN dedup_key varchar(200)`);
    await q.query(`CREATE UNIQUE INDEX uq_outbox_dedup_key ON outbox_events (dedup_key)`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS uq_outbox_dedup_key`);
    await q.query(`ALTER TABLE outbox_events DROP COLUMN IF EXISTS dedup_key`);
  }
}