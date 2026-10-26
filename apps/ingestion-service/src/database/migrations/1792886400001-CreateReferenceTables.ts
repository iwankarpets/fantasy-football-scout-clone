import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Справочники из bootstrap-static: teams, element_types, gameweeks.
 * Все id приходят из FPL API, поэтому PK без автоинкремента.
 */
export class CreateReferenceTables1792886400001 implements MigrationInterface {
  name = 'CreateReferenceTables1792886400001';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE teams (
        id                    integer PRIMARY KEY,
        code                  integer      NOT NULL,
        name                  varchar(100) NOT NULL,
        short_name            varchar(10)  NOT NULL,
        strength_overall_home integer      NOT NULL DEFAULT 0,
        strength_overall_away integer      NOT NULL DEFAULT 0,
        strength_attack_home  integer      NOT NULL DEFAULT 0,
        strength_attack_away  integer      NOT NULL DEFAULT 0,
        strength_defence_home integer      NOT NULL DEFAULT 0,
        strength_defence_away integer      NOT NULL DEFAULT 0,
        played                integer      NOT NULL DEFAULT 0,
        win                   integer      NOT NULL DEFAULT 0,
        draw                  integer      NOT NULL DEFAULT 0,
        loss                  integer      NOT NULL DEFAULT 0,
        points                integer      NOT NULL DEFAULT 0,
        position              integer      NOT NULL DEFAULT 0,
        form                  numeric(4,1),            -- null в межсезонье
        strength              integer,                 -- может быть null
        raw                   jsonb        NOT NULL,
        updated_at            timestamptz  NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE element_types (
        id                  integer PRIMARY KEY,       -- 1 GKP, 2 DEF, 3 MID, 4 FWD
        singular_name       varchar(50) NOT NULL,
        singular_name_short varchar(10) NOT NULL,
        plural_name         varchar(50) NOT NULL,
        plural_name_short   varchar(10) NOT NULL,
        squad_select        integer     NOT NULL,
        squad_min_play      integer     NOT NULL,
        squad_max_play      integer     NOT NULL,
        element_count       integer     NOT NULL DEFAULT 0,
        updated_at          timestamptz NOT NULL DEFAULT now()
      )
    `);

    // id = номер тура, отдельной колонки number нет
    await q.query(`
      CREATE TABLE gameweeks (
        id                    integer PRIMARY KEY,
        name                  varchar(50)  NOT NULL,
        deadline_time         timestamptz  NOT NULL,
        deadline_time_epoch   bigint       NOT NULL,
        finished              boolean      NOT NULL DEFAULT false,
        data_checked          boolean      NOT NULL DEFAULT false,
        is_previous           boolean      NOT NULL DEFAULT false,
        is_current            boolean      NOT NULL DEFAULT false,
        is_next               boolean      NOT NULL DEFAULT false,
        release_time          timestamptz,
        average_entry_score   integer,
        highest_score         integer,
        top_element           integer,
        most_selected         integer,
        most_transferred_in   integer,
        most_captained        integer,
        most_vice_captained   integer,
        raw                   jsonb        NOT NULL,
        updated_at            timestamptz  NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS gameweeks`);
    await q.query(`DROP TABLE IF EXISTS element_types`);
    await q.query(`DROP TABLE IF EXISTS teams`);
  }
}
