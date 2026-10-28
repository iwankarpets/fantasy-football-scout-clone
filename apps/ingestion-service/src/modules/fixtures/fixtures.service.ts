import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { FixturesRepository } from './fixture.repository';
import { mapFixture } from './fixture.mapper';
import { ApiFplFixture } from '../../clients/fpl-api/schemas/fixtures.schema';



@Injectable()
export class FixturesService {
  constructor(private readonly repository: FixturesRepository) {}

  /** Приводит ответ API к строкам и делает upsert по id. Возвращает число строк. */
  upsertFromApi(items: ApiFplFixture[], manager?: EntityManager): Promise<number> {
    const now = new Date();
    return this.repository.upsertMany(
      items.map((item) => mapFixture(item, now)),
      manager,
    );
  }
}