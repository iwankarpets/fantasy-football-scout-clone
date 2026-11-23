import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * В живом ответе bootstrap-static у игрока встретился статус 'n', которого нет
 * в ограничении players_status_chk. Список допустимых значений расширяется.
 */
export class AllowPlayerStatusN1795452480000 implements MigrationInterface {
  name = 'AllowPlayerStatusN1795452480000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE players DROP CONSTRAINT players_status_chk`);
    await q.query(`
      ALTER TABLE players
        ADD CONSTRAINT players_status_chk
        CHECK (status IN ('a', 'd', 'i', 's', 'u', 'n'))
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    // Откат упадёт, если в таблице уже есть игроки со статусом 'n'.
    await q.query(`ALTER TABLE players DROP CONSTRAINT players_status_chk`);
    await q.query(`
      ALTER TABLE players
        ADD CONSTRAINT players_status_chk
        CHECK (status IN ('a', 'd', 'i', 's', 'u'))
    `);
  }
}
