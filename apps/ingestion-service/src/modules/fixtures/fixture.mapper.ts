import { FplFixture } from '../../clients/fpl-api/schemas/fixtures.schema';
import { Fixture } from '../../database/entities/fixture.entity';


export function mapFixture(f: FplFixture): Partial<Fixture> {
  return {
    id: f.id,
    code: f.code,
    event: f.event,                       // null у перенесённых матчей
    team_h: f.team_h,
    team_a: f.team_a,
    team_h_score: f.team_h_score,
    team_a_score: f.team_a_score,
    kickoff_time: f.kickoff_time ? new Date(f.kickoff_time) : null,
    team_h_difficulty: f.team_h_difficulty,
    team_a_difficulty: f.team_a_difficulty,
    started: f.started ?? false,
    finished: f.finished,
    finished_provisional: f.finished_provisional,
    minutes: f.minutes,
  };
}