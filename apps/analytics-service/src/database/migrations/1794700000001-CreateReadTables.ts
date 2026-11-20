import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReadTables1794700000001 implements MigrationInterface {
  name = 'CreateReadTables1794700000001';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE element_types_read (
        id                   integer PRIMARY KEY,
        singular_name        varchar(50) NOT NULL,
        singular_name_short  varchar(10) NOT NULL,
        plural_name          varchar(50) NOT NULL,
        plural_name_short    varchar(10) NOT NULL,
        squad_select         integer     NOT NULL,
        squad_min_play       integer     NOT NULL,
        squad_max_play       integer     NOT NULL,
        element_count        integer     NOT NULL
      )
    `);

    await q.query(`
      CREATE TABLE teams_read (
        id                     integer PRIMARY KEY,
        code                   integer     NOT NULL,
        name                   varchar(100) NOT NULL,
        short_name             varchar(10) NOT NULL,
        strength_overall_home  integer NOT NULL DEFAULT 0,
        strength_overall_away  integer NOT NULL DEFAULT 0,
        strength_attack_home   integer NOT NULL DEFAULT 0,
        strength_attack_away   integer NOT NULL DEFAULT 0,
        strength_defence_home  integer NOT NULL DEFAULT 0,
        strength_defence_away  integer NOT NULL DEFAULT 0,
        played                 integer NOT NULL DEFAULT 0,
        win                    integer NOT NULL DEFAULT 0,
        draw                   integer NOT NULL DEFAULT 0,
        loss                   integer NOT NULL DEFAULT 0,
        points                 integer NOT NULL DEFAULT 0,
        position               integer NOT NULL DEFAULT 0,
        form                   numeric,
        strength               integer,
        synced_at              timestamptz NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE players_read (
        id                            integer PRIMARY KEY,
        code                          integer      NOT NULL,
        team                          integer      NOT NULL,
        element_type                  integer      NOT NULL,
        first_name                    varchar(100) NOT NULL,
        second_name                   varchar(100) NOT NULL,
        web_name                      varchar(100) NOT NULL,
        now_cost                      integer      NOT NULL,
        status                        varchar(1)   NOT NULL,
        chance_of_playing_next_round  integer,
        news                          text         NOT NULL DEFAULT '',
        news_added                    timestamptz,
        selected_by_percent           numeric      NOT NULL DEFAULT 0,
        form                          numeric      NOT NULL DEFAULT 0,
        points_per_game               numeric      NOT NULL DEFAULT 0,
        total_points                  integer      NOT NULL DEFAULT 0,
        minutes                       integer      NOT NULL DEFAULT 0,
        starts                        integer      NOT NULL DEFAULT 0,
        goals_scored                  integer      NOT NULL DEFAULT 0,
        assists                       integer      NOT NULL DEFAULT 0,
        clean_sheets                  integer      NOT NULL DEFAULT 0,
        bps                           integer      NOT NULL DEFAULT 0,
        expected_goals                numeric      NOT NULL DEFAULT 0,
        expected_assists              numeric      NOT NULL DEFAULT 0,
        ict_index                     numeric      NOT NULL DEFAULT 0,
        defensive_contribution        numeric      NOT NULL DEFAULT 0,
        ep_next                       numeric,
        ep_this                       numeric,
        cost_change_event             integer      NOT NULL DEFAULT 0,
        cost_change_start             integer      NOT NULL DEFAULT 0,
        transfers_in_event            integer      NOT NULL DEFAULT 0,
        transfers_out_event           integer      NOT NULL DEFAULT 0,
        synced_at                     timestamptz  NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_players_read_team ON players_read (team)`);
    await q.query(`CREATE INDEX idx_players_read_type ON players_read (element_type)`);
    await q.query(`CREATE INDEX idx_players_read_name ON players_read (lower(web_name))`);

    await q.query(`
      CREATE TABLE gameweeks_read (
        id                    integer PRIMARY KEY,
        name                  varchar(50) NOT NULL,
        deadline_time         timestamptz NOT NULL,
        deadline_time_epoch   integer     NOT NULL,
        finished              boolean     NOT NULL DEFAULT false,
        data_checked          boolean     NOT NULL DEFAULT false,
        is_previous           boolean     NOT NULL DEFAULT false,
        is_current            boolean     NOT NULL DEFAULT false,
        is_next               boolean     NOT NULL DEFAULT false,
        release_time          timestamptz,
        average_entry_score   integer,
        highest_score         integer,
        top_element           integer,
        most_selected         integer,
        most_transferred_in   integer,
        most_captained        integer,
        most_vice_captained   integer,
        synced_at             timestamptz NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE fixtures_read (
        id                    integer PRIMARY KEY,
        code                  integer     NOT NULL,
        event                 integer,
        team_h                integer     NOT NULL,
        team_a                integer     NOT NULL,
        team_h_score          integer,
        team_a_score          integer,
        kickoff_time          timestamptz,
        team_h_difficulty     integer     NOT NULL,
        team_a_difficulty     integer     NOT NULL,
        started               boolean     NOT NULL DEFAULT false,
        finished              boolean     NOT NULL DEFAULT false,
        finished_provisional  boolean     NOT NULL DEFAULT false,
        minutes               integer     NOT NULL DEFAULT 0,
        synced_at             timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_fixtures_read_event ON fixtures_read (event)`);
    await q.query(`CREATE INDEX idx_fixtures_read_h ON fixtures_read (team_h)`);
    await q.query(`CREATE INDEX idx_fixtures_read_a ON fixtures_read (team_a)`);

    await q.query(`
      CREATE TABLE processed_events (
        event_id      uuid PRIMARY KEY,
        processed_at  timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS processed_events`);
    await q.query(`DROP TABLE IF EXISTS fixtures_read`);
    await q.query(`DROP TABLE IF EXISTS gameweeks_read`);
    await q.query(`DROP TABLE IF EXISTS players_read`);
    await q.query(`DROP TABLE IF EXISTS teams_read`);
    await q.query(`DROP TABLE IF EXISTS element_types_read`);
  }
}
