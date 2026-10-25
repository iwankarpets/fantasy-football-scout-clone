import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * fixtures <- только глобальный /fixtures/.
 * Массив stats не хранится: источник истины по игроку это element-summary.history.
 */
export class CreateFixtures1792886400003 implements MigrationInterface {
  name = 'CreateFixtures1792886400003';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE fixtures (
        id                    integer PRIMARY KEY,
        code                  integer     NOT NULL,
        event                 integer,                 -- номер тура, null при переносе
        team_h                integer     NOT NULL,
        team_a                integer     NOT NULL,
        team_h_score          integer,                 -- null пока матч не сыгран
        team_a_score          integer,
        kickoff_time          timestamptz,             -- null у неназначенных матчей
        team_h_difficulty     smallint    NOT NULL,    -- 1-5
        team_a_difficulty     smallint    NOT NULL,    -- 1-5
        started               boolean,                 -- в API бывает null
        finished              boolean     NOT NULL DEFAULT false,
        finished_provisional  boolean     NOT NULL DEFAULT false,
        minutes               integer     NOT NULL DEFAULT 0,
        updated_at            timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fixtures_difficulty_chk CHECK (
          team_h_difficulty BETWEEN 1 AND 5 AND team_a_difficulty BETWEEN 1 AND 5
        )
      )
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS fixtures`);
  }
}