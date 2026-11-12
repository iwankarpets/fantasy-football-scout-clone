import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTables1794441600001 implements MigrationInterface {
  name = 'CreateNotificationTables1794441600001';

  public async up(q: QueryRunner): Promise<void> {
    // Копия пользователей и их настроек (наполняется событиями user.*)
    await q.query(`
      CREATE TABLE recipients (
        user_id                  uuid PRIMARY KEY,
        telegram_chat_id         bigint       NOT NULL,
        timezone                 varchar(64)  NOT NULL DEFAULT 'UTC',
        language                 varchar(5)   NOT NULL DEFAULT 'ru',
        deadline_reminder_hours  integer[]    NOT NULL DEFAULT '{24,3}',
        notify_report            boolean      NOT NULL DEFAULT true,
        notify_injuries          boolean      NOT NULL DEFAULT true,
        notify_price             boolean      NOT NULL DEFAULT true,
        quiet_from               varchar(5),
        quiet_to                 varchar(5),
        is_active                boolean      NOT NULL DEFAULT true,
        created_at               timestamptz  NOT NULL DEFAULT now(),
        updated_at               timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT recipients_quiet_pair_chk
          CHECK ((quiet_from IS NULL) = (quiet_to IS NULL))
      )
    `);
    await q.query(`CREATE INDEX idx_recipients_chat ON recipients (telegram_chat_id)`);

    // Копия списков наблюдения. Главный запрос: "кто следит за игроком X"
    await q.query(`
      CREATE TABLE watch_refs (
        user_id    uuid        NOT NULL,
        player_id  integer     NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, player_id)
      )
    `);
    await q.query(`CREATE INDEX idx_watch_refs_player ON watch_refs (player_id)`);

    await q.query(`
      CREATE TABLE notifications (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       uuid         NOT NULL,
        type          varchar(50)  NOT NULL,
        dedup_key     varchar(200) NOT NULL,
        payload       jsonb        NOT NULL,
        status        varchar(10)  NOT NULL DEFAULT 'queued',
        attempts      integer      NOT NULL DEFAULT 0,
        error         text,
        scheduled_at  timestamptz  NOT NULL DEFAULT now(),
        sent_at       timestamptz,
        created_at    timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT notifications_status_chk CHECK (status IN ('queued','sent','failed'))
      )
    `);
    await q.query(`CREATE UNIQUE INDEX uq_notifications_dedup ON notifications (dedup_key)`);
    await q.query(`
      CREATE INDEX idx_notifications_due ON notifications (scheduled_at)
      WHERE status = 'queued'
    `);
    await q.query(`CREATE INDEX idx_notifications_user ON notifications (user_id)`);

    await q.query(`
      CREATE TABLE processed_events (
        event_id      uuid PRIMARY KEY,
        processed_at  timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS processed_events`);
    await q.query(`DROP TABLE IF EXISTS notifications`);
    await q.query(`DROP TABLE IF EXISTS watch_refs`);
    await q.query(`DROP TABLE IF EXISTS recipients`);
  }
}
