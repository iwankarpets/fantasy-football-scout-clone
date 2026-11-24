import { MigrationInterface, QueryRunner } from 'typeorm';

/** Одна сложность вместо attack/defence; уникальность нужна для upsert. */
export class TeamDifficultySingleScore1700000000001 implements MigrationInterface {
  name = 'TeamDifficultySingleScore1700000000001';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE team_fixture_difficulty ADD COLUMN IF NOT EXISTS difficulty numeric(4,2)`,
    );
    await q.query(`ALTER TABLE team_fixture_difficulty DROP COLUMN IF EXISTS attack_difficulty`);
    await q.query(`ALTER TABLE team_fixture_difficulty DROP COLUMN IF EXISTS defence_difficulty`);
    await q.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_team_fixture_difficulty
         ON team_fixture_difficulty (team_id, as_of_gameweek, horizon)`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS uq_team_fixture_difficulty`);
    await q.query(
      `ALTER TABLE team_fixture_difficulty ADD COLUMN IF NOT EXISTS attack_difficulty numeric(4,2)`,
    );
    await q.query(
      `ALTER TABLE team_fixture_difficulty ADD COLUMN IF NOT EXISTS defence_difficulty numeric(4,2)`,
    );
    await q.query(`ALTER TABLE team_fixture_difficulty DROP COLUMN IF EXISTS difficulty`);
  }
}
