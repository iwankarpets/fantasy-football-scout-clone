import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWriteTables1794700000002 implements MigrationInterface {
  name = 'CreateWriteTables1794700000002';

  public async up(q: QueryRunner): Promise<void> {
    // ── Копия истории игроков из Ingestion (источник для метрик) ──
    // Одна строка = один матч игрока. PK совпадает с уникальностью в Ingestion.
    await q.query(`
      CREATE TABLE player_gameweek_stats_read (
        element                      integer      NOT NULL,
        fixture                      integer      NOT NULL,
        round                        integer      NOT NULL,
        opponent_team                integer      NOT NULL,
        was_home                     boolean      NOT NULL,
        minutes                      integer      NOT NULL DEFAULT 0,
        starts                       integer      NOT NULL DEFAULT 0,
        goals_scored                 integer      NOT NULL DEFAULT 0,
        assists                      integer      NOT NULL DEFAULT 0,
        clean_sheets                 integer      NOT NULL DEFAULT 0,
        goals_conceded               integer      NOT NULL DEFAULT 0,
        saves                        integer      NOT NULL DEFAULT 0,
        bonus                        integer      NOT NULL DEFAULT 0,
        bps                          integer      NOT NULL DEFAULT 0,
        yellow_cards                 integer      NOT NULL DEFAULT 0,
        red_cards                    integer      NOT NULL DEFAULT 0,
        total_points                 integer      NOT NULL DEFAULT 0,
        expected_goals               numeric      NOT NULL DEFAULT 0,
        expected_assists             numeric      NOT NULL DEFAULT 0,
        expected_goal_involvements   numeric      NOT NULL DEFAULT 0,
        expected_goals_conceded      numeric      NOT NULL DEFAULT 0,
        value                        integer      NOT NULL DEFAULT 0,
        selected                     integer      NOT NULL DEFAULT 0,
        transfers_in                 integer      NOT NULL DEFAULT 0,
        transfers_out                integer      NOT NULL DEFAULT 0,
        transfers_balance            integer      NOT NULL DEFAULT 0,
        synced_at                    timestamptz  NOT NULL DEFAULT now(),
        PRIMARY KEY (element, fixture)
      )
    `);
    await q.query(
      `CREATE INDEX idx_pgs_read_element_round ON player_gameweek_stats_read (element, round)`,
    );
    await q.query(`CREATE INDEX idx_pgs_read_round ON player_gameweek_stats_read (round)`);

    // ── Метрики игроков: результат пересчёта ──
    // Метрики nullable: "нет данных" не должно маскироваться нулём.
    await q.query(`
      CREATE TABLE player_metrics (
        player_id            integer      NOT NULL,
        as_of_gameweek       integer      NOT NULL,
        form_3               numeric,
        form_5               numeric,
        avg_minutes_5        numeric,
        minutes_reliability  numeric,
        points_per_million   numeric,
        xgi_per90_5          numeric,
        ownership_trend      numeric,
        position_rank        integer,
        score                numeric,
        computed_at          timestamptz  NOT NULL DEFAULT now(),
        PRIMARY KEY (player_id, as_of_gameweek)
      )
    `);
    await q.query(
      `CREATE INDEX idx_player_metrics_gw_score ON player_metrics (as_of_gameweek, score DESC)`,
    );
    await q.query(
      `CREATE INDEX idx_player_metrics_gw_form5 ON player_metrics (as_of_gameweek, form_5 DESC)`,
    );

    // ── Календарь сложности команд ──
    await q.query(`
      CREATE TABLE team_fixture_difficulty (
        team_id             integer      NOT NULL,
        as_of_gameweek      integer      NOT NULL,
        horizon             smallint     NOT NULL CHECK (horizon IN (3, 5)),
        attack_difficulty   numeric,
        defence_difficulty  numeric,
        matches_count       integer      NOT NULL DEFAULT 0,
        has_double          boolean      NOT NULL DEFAULT false,
        has_blank           boolean      NOT NULL DEFAULT false,
        computed_at         timestamptz  NOT NULL DEFAULT now(),
        PRIMARY KEY (team_id, as_of_gameweek, horizon)
      )
    `);

    // ── Разборы тура ──
    // Один отчёт на тур: повторная генерация делает upsert по gameweek_number.
    await q.query(`
      CREATE TABLE gameweek_reports (
        id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
        gameweek_number  integer      NOT NULL UNIQUE,
        generated_at     timestamptz  NOT NULL DEFAULT now(),
        status           varchar(20)  NOT NULL DEFAULT 'generating'
                         CHECK (status IN ('generating', 'ready', 'failed')),
        payload          jsonb        NOT NULL DEFAULT '{}'::jsonb
      )
    `);

    // ── Outbox: report.ready и другие события Analytics ──
    // Структуру сверь с outbox_events в ingestion-service и user-service.
    await q.query(`
      CREATE TABLE outbox_events (
        id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
        type          varchar(100) NOT NULL,
        payload       jsonb        NOT NULL,
        created_at    timestamptz  NOT NULL DEFAULT now(),
        published_at  timestamptz
      )
    `);
    await q.query(`
      CREATE INDEX idx_outbox_events_unpublished
        ON outbox_events (created_at)
        WHERE published_at IS NULL
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS outbox_events`);
    await q.query(`DROP TABLE IF EXISTS gameweek_reports`);
    await q.query(`DROP TABLE IF EXISTS team_fixture_difficulty`);
    await q.query(`DROP TABLE IF EXISTS player_metrics`);
    await q.query(`DROP TABLE IF EXISTS player_gameweek_stats_read`);
  }
}
