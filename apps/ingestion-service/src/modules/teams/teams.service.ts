import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApiTeam } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { TeamsRepository } from './teams.repository';
import { mapTeam } from './teams.mapper';

@Injectable()
export class TeamsService {
  constructor(private readonly repository: TeamsRepository) {}

  /** Приводит ответ API к строкам и делает upsert по id. Возвращает число строк. */
  upsertFromApi(items: ApiTeam[], manager?: EntityManager): Promise<number> {
    const now = new Date();
    return this.repository.upsertMany(
      items.map((item) => mapTeam(item, now)),
      manager,
    );
  }
}
