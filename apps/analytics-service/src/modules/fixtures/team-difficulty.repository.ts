import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FixtureLite, GameweekLite, TeamDifficultyRow } from './team-difficulty.calc';

export interface TeamDifficultyItemDto {
  team_id: number;
  team_short_name: string;
  as_of_gameweek: number;
  horizon: number;
  difficulty: number | null;
  matches_count: number;
  has_double: boolean;
  has_blank: boolean;
}

@Injectable()
export class TeamDifficultyRepository {
  constructor(private readonly ds: DataSource) {}

  async loadInput(): Promise<{
    teamIds: number[];
    gameweeks: GameweekLite[];
    fixtures: FixtureLite[];
  }> {
    const [teams, gameweeks, fixtures] = await Promise.all([
      this.ds.query('SELECT id FROM teams_read ORDER BY id'),
      this.ds.query('SELECT id, finished FROM gameweeks_read ORDER BY id'),
      this.ds.query(
        `SELECT event, team_h, team_a, team_h_difficulty, team_a_difficulty,
                finished, finished_provisional
           FROM fixtures_read
          WHERE event IS NOT NULL`,
      ),
    ]);
    return {
      teamIds: teams.map((t: { id: number }) => t.id),
      gameweeks,
      fixtures,
    };
  }

  async upsertMany(rows: TeamDifficultyRow[]): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const res: unknown[] = await this.ds.query(
      `INSERT INTO team_fixture_difficulty
         (team_id, as_of_gameweek, horizon, difficulty, matches_count, has_double, has_blank)
       SELECT * FROM unnest(
         $1::int[], $2::int[], $3::int[], $4::numeric[], $5::int[], $6::bool[], $7::bool[]
       )
       ON CONFLICT (team_id, as_of_gameweek, horizon) DO UPDATE SET
         difficulty    = EXCLUDED.difficulty,
         matches_count = EXCLUDED.matches_count,
         has_double    = EXCLUDED.has_double,
         has_blank     = EXCLUDED.has_blank
       RETURNING team_id`,
      [
        rows.map((r) => r.team_id),
        rows.map((r) => r.as_of_gameweek),
        rows.map((r) => r.horizon),
        rows.map((r) => r.difficulty),
        rows.map((r) => r.matches_count),
        rows.map((r) => r.has_double),
        rows.map((r) => r.has_blank),
      ],
    );
    return res.length;
  }

  /** Последний рассчитанный срез для горизонта; лёгкий календарь первым. */
  findLatest(horizon: number): Promise<TeamDifficultyItemDto[]> {
    return this.ds.query(
      `SELECT d.team_id, t.short_name AS team_short_name,
              d.as_of_gameweek, d.horizon,
              d.difficulty::float8 AS difficulty,
              d.matches_count, d.has_double, d.has_blank
         FROM team_fixture_difficulty d
         JOIN teams_read t ON t.id = d.team_id
        WHERE d.horizon = $1
          AND d.as_of_gameweek = (
                SELECT MAX(as_of_gameweek) FROM team_fixture_difficulty WHERE horizon = $1)
        ORDER BY d.difficulty NULLS LAST, d.team_id`,
      [horizon],
    );
  }
}
