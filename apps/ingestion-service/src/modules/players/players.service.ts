import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApiPlayer } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { PlayersRepository } from './players.repository';
import { mapPlayer } from './players.mapper';

@Injectable()
export class PlayersService {
  constructor(private readonly repository: PlayersRepository) {}

  /** Приводит ответ API к строкам и делает upsert по id. Возвращает число строк. */
  upsertFromApi(items: ApiPlayer[], manager?: EntityManager): Promise<number> {
    const now = new Date();
    return this.repository.upsertMany(
      items.map((item) => mapPlayer(item, now)),
      manager,
    );
  }
}
