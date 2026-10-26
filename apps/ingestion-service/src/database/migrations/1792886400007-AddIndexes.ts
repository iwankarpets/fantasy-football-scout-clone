import { MigrationInterface, QueryRunner } from 'typeorm';

/** Индексы отдельной миграцией, чтобы их было легко менять. */
export class AddIndexes1792886400007 implements MigrationInterface {
  name = 'AddIndexes1792886400007';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE INDEX idx_players_team         ON players (team)`);
    await q.query(`CREATE INDEX idx_players_element_type ON players (element_type)`);

    await q.query(`CREATE INDEX idx_fixtures_event  ON fixtures (event)`);
    await q.query(`CREATE INDEX idx_fixtures_team_h ON fixtures (team_h)`);
    await q.query(`CREATE INDEX idx_fixtures_team_a ON fixtures (team_a)`);

    await q.query(`CREATE INDEX idx_gameweeks_deadline_epoch ON gameweeks (deadline_time_epoch)`);

    await q.query(`CREATE INDEX idx_pgs_element_round ON player_gameweek_stats (element, round)`);
    await q.query(`CREATE INDEX idx_pgs_round         ON player_gameweek_stats (round)`);

    await q.query(`CREATE INDEX idx_snapshots_player_captured ON player_snapshots (player_id, captured_at)`);
    await q.query(`CREATE INDEX idx_changes_player_detected   ON player_changes (player_id, detected_at)`);

    await q.query(`CREATE INDEX idx_sync_runs_endpoint_started ON sync_runs (endpoint, started_at DESC)`);

    // publisher каждую секунду выбирает только неотправленные строки
    await q.query(`
      CREATE INDEX idx_outbox_unpublished ON outbox_events (created_at)
      WHERE published_at IS NULL
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const idx of [
      'idx_outbox_unpublished',
      'idx_sync_runs_endpoint_started',
      'idx_changes_player_detected',
      'idx_snapshots_player_captured',
      'idx_pgs_round',
      'idx_pgs_element_round',
      'idx_gameweeks_deadline_epoch',
      'idx_fixtures_team_a',
      'idx_fixtures_team_h',
      'idx_fixtures_event',
      'idx_players_element_type',
      'idx_players_team',
    ]) {
      await q.query(`DROP INDEX IF EXISTS ${idx}`);
    }
  }
}
