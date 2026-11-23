import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * bulkUpsert пишет synced_at во все таблицы-копии, а в element_types_read
 * этой колонки не было. Теперь она есть, как у остальных копий.
 */
export class AddElementTypesSyncedAt1794700000004 implements MigrationInterface {
  name = 'AddElementTypesSyncedAt1794700000004';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE element_types_read ADD COLUMN IF NOT EXISTS synced_at timestamptz NOT NULL DEFAULT now()`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE element_types_read DROP COLUMN IF EXISTS synced_at`);
  }
}
