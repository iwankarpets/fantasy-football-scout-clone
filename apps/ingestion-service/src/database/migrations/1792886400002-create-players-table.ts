import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * players <- bootstrap-static.elements.
 * Строковые поля API (form, selected_by_percent, expected_*, ict_index, ep_*)
 * хранятся как numeric: приведение делает код при записи.
 * FK на teams/element_types намеренно нет (порядок загрузки, см. README).
 */
export class CreatePlayers1792886400002 implements MigrationInterface {
  name = 'CreatePlayers1792886400002';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE players (
        id                            integer PRIMARY KEY,
        code                          integer      NOT NULL,  -- стабильный между сезонами
        team                          integer      NOT NULL,
        element_type                  integer      NOT NULL,
        first_name                    varchar(100) NOT NULL,
        second_name                   varchar(100) NOT NULL,
        web_name                      varchar(100) NOT NULL,
        now_cost                      integer      NOT NULL,  -- в десятых: 61 = 6.1
        status                        varchar(1)   NOT NULL,  -- a / d / i / s / u
        chance_of_playing_next_round  integer,                -- может быть null
        news                          text         NOT NULL DEFAULT '',
        news_added                    timestamptz,            -- может быть null
        selected_by_percent           numeric(5,2) NOT NULL DEFAULT 0,
        form                          numeric(4,1) NOT NULL DEFAULT 0,
        points_per_game               numeric(4,1) NOT NULL DEFAULT 0,
        total_points                  integer      NOT NULL DEFAULT 0,
        minutes                       integer      NOT NULL DEFAULT 0,
        starts                        integer      NOT NULL DEFAULT 0,
        goals_scored                  integer      NOT NULL DEFAULT 0,
        assists                       integer      NOT NULL DEFAULT 0,
        clean_sheets                  integer      NOT NULL DEFAULT 0,
        bps                           integer      NOT NULL DEFAULT 0,
        expected_goals                numeric(6,2) NOT NULL DEFAULT 0,
        expected_assists              numeric(6,2) NOT NULL DEFAULT 0,
        ict_index                     numeric(7,1) NOT NULL DEFAULT 0,
        defensive_contribution        integer      NOT NULL DEFAULT 0,
        ep_next                       numeric(5,1),
        ep_this                       numeric(5,1),
        cost_change_event             integer      NOT NULL DEFAULT 0,
        cost_change_start             integer      NOT NULL DEFAULT 0,
        transfers_in_event            integer      NOT NULL DEFAULT 0,
        transfers_out_event           integer      NOT NULL DEFAULT 0,
        raw                           jsonb        NOT NULL,
        updated_at                    timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT players_status_chk CHECK (status IN ('a','d','i','s','u'))
      )
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS players`);
  }
}