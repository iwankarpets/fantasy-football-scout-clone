import { Team } from '../../database/entities/team.entity';
import { ApiTeam } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { toNumber } from '../../utils/parse';

export function mapTeam(api: ApiTeam, now: Date): Team {
  return {
    id: api.id,
    code: api.code,
    name: api.name,
    short_name: api.short_name,
    // В межсезонье strength_attack_* и strength_defence_* равны 0: это нормально
    strength_overall_home: api.strength_overall_home,
    strength_overall_away: api.strength_overall_away,
    strength_attack_home: api.strength_attack_home,
    strength_attack_away: api.strength_attack_away,
    strength_defence_home: api.strength_defence_home,
    strength_defence_away: api.strength_defence_away,
    played: api.played,
    win: api.win,
    draw: api.draw,
    loss: api.loss,
    points: api.points,
    position: api.position,
    form: toNumber(api.form), // в межсезонье null
    strength: api.strength ?? null,
    raw: api,
    updated_at: now,
  };
}
