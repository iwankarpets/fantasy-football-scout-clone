import { Fixture } from '../../database/entities/fixture.entity';
import { ApiFplFixture } from '../../clients/fpl-api/schemas/fixtures.schema';
import { toDate } from '../../utils/parse';

export function mapFixture(api: ApiFplFixture, now: Date): Fixture {
  return {
    id: api.id,
    code: api.code,
    event: api.event ?? null, // номер тура = gameweeks.id; null у перенесённых матчей
    team_h: api.team_h,
    team_a: api.team_a,
    team_h_score: api.team_h_score ?? null,
    team_a_score: api.team_a_score ?? null,
    kickoff_time: toDate(api.kickoff_time),
    team_h_difficulty: api.team_h_difficulty,
    team_a_difficulty: api.team_a_difficulty,
    started: api.started ?? null,
    finished: api.finished,
    finished_provisional: api.finished_provisional,
    minutes: api.minutes,
    updated_at: now,
  };
}