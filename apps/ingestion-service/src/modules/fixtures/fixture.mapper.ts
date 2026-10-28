import { ApiFplFixture } from '../../clients/fpl-api/schemas/fixtures.schema';
import { Fixture } from '../../database/entities/fixture.entity';

export function mapFixture(item: ApiFplFixture, now: Date): Fixture {
  const row = new Fixture();
  row.id = item.id;
  row.code = item.code;
  row.event = item.event;                        // null у перенесённых матчей
  row.team_h = item.team_h;
  row.team_a = item.team_a;
  row.team_h_score = item.team_h_score;
  row.team_a_score = item.team_a_score;
  row.kickoff_time = item.kickoff_time ? new Date(item.kickoff_time) : null;
  row.team_h_difficulty = item.team_h_difficulty;
  row.team_a_difficulty = item.team_a_difficulty;
  row.started = item.started;                    // null остаётся null
  row.finished = item.finished;
  row.finished_provisional = item.finished_provisional;
  row.minutes = item.minutes;
  row.updated_at = now;
  return row;
}