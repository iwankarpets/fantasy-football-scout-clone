import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTables1792972800001 implements MigrationInterface {
  name = 'CreateUserTables1792972800001';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE users (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        telegram_id   bigint       NOT NULL UNIQUE,
        username      varchar(64),
        language      varchar(5)   NOT NULL DEFAULT 'ru',
        timezone      varchar(64)  NOT NULL DEFAULT 'UTC',
        role          varchar(10)  NOT NULL DEFAULT 'user',
        is_active     boolean      NOT NULL DEFAULT true,
        created_at    timestamptz  NOT NULL DEFAULT now(),
        last_seen_at  timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT users_role_chk CHECK (role IN ('user','admin'))
      )
    `);

    await q.query(`
      CREATE TABLE watchlist (
        user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        player_id  integer     NOT NULL,
        added_at   timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, player_id)
      )
    `);

    await q.query(`
      CREATE TABLE notification_settings (
        user_id                  uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        deadline_reminder_hours  integer[]    NOT NULL DEFAULT '{24,3}',
        notify_report            boolean      NOT NULL DEFAULT true,
        notify_injuries          boolean      NOT NULL DEFAULT true,
        notify_price             boolean      NOT NULL DEFAULT true,
        quiet_from               varchar(5),
        quiet_to                 varchar(5),
        updated_at               timestamptz  NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE outbox_events (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type          varchar(100) NOT NULL,
        payload       jsonb        NOT NULL,
        created_at    timestamptz  NOT NULL DEFAULT now(),
        published_at  timestamptz,
        dedup_key     varchar(200)
      )
    `);
    await q.query(`CREATE UNIQUE INDEX uq_outbox_dedup_key ON outbox_events (dedup_key)`);
    await q.query(`
      CREATE INDEX idx_outbox_unpublished ON outbox_events (created_at)
      WHERE published_at IS NULL
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS outbox_events`);
    await q.query(`DROP TABLE IF EXISTS notification_settings`);
    await q.query(`DROP TABLE IF EXISTS watchlist`);
    await q.query(`DROP TABLE IF EXISTS users`);
  }
}
