import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Нечёткий поиск игроков: расширения pg_trgm и unaccent, колонка search_name
 * (имя без регистра и диакритики) и GIN-индекс по триграммам.
 *
 * pg_trgm и unaccent входят в список "trusted" расширений (PostgreSQL 13+),
 * поэтому владельцу базы хватает прав на CREATE EXTENSION. На старых версиях
 * нужен суперпользователь, например через init-скрипт в infra/.
 */
export class AddPlayerSearch1794700000003 implements MigrationInterface {
  name = 'AddPlayerSearch1794700000003';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);

    // unaccent() не помечена IMMUTABLE, а для generated-колонки и индекса нужна именно такая.
    await q.query(`
      CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
        LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
        AS $$ SELECT public.unaccent('public.unaccent', $1) $$
    `);

    await q.query(`
      ALTER TABLE players_read
        ADD COLUMN search_name text GENERATED ALWAYS AS (
          f_unaccent(lower(web_name || ' ' || first_name || ' ' || second_name))
        ) STORED
    `);
    await q.query(
      `CREATE INDEX idx_players_read_search_name ON players_read USING gin (search_name gin_trgm_ops)`,
    );

    // Обычный btree по lower(web_name) для поиска по подстроке не работает.
    await q.query(`DROP INDEX IF EXISTS idx_players_read_name`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`CREATE INDEX idx_players_read_name ON players_read (lower(web_name))`);
    await q.query(`DROP INDEX IF EXISTS idx_players_read_search_name`);
    await q.query(`ALTER TABLE players_read DROP COLUMN IF EXISTS search_name`);
    await q.query(`DROP FUNCTION IF EXISTS f_unaccent(text)`);
    // Расширения не удаляются: ими могут пользоваться другие объекты.
  }
}
