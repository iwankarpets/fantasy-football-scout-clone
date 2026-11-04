import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApiGameweek } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { GameweeksRepository } from './gameweeks.repository';
import { mapGameweek } from './gameweeks.mapper';
import { Gameweek } from '../../database/entities/gameweek.entity';

@Injectable()
export class GameweeksService {
  constructor(private readonly repository: GameweeksRepository) {}

  /** Приводит ответ API к строкам и делает upsert по id. Возвращает число строк. */
  upsertFromApi(items: ApiGameweek[], manager?: EntityManager): Promise<number> {
    const now = new Date();
    return this.repository.upsertMany(
      items.map((item) => mapGameweek(item, now)),
      manager,
    );
  }

  currentOrNextNumber(manager?: EntityManager): Promise<number | null> {
    return this.repository.findCurrentOrNextId(manager);
  }

  nextDeadline(now = new Date()): Promise<Gameweek | null> {
    return this.repository.findNextDeadline(Math.floor(now.getTime() / 1000));
  }
}
