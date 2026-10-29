import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApiFplElementHistoryItem } from '../../clients/fpl-api/schemas/element-summary.schema';
import { PlayerGameweekStatsRepository } from './player-gameweek-stats.repository';
import { mapPlayerGameweekStats } from './player-gameweek-stats.mapper';

@Injectable()
export class PlayerGameweekStatsService {
  constructor(private readonly repository: PlayerGameweekStatsRepository) {}

  /** history одного игрока → upsert по (element, fixture). Возвращает число строк. */
  upsertFromApi(items: ApiFplElementHistoryItem[], manager?: EntityManager): Promise<number> {
    const now = new Date();
    return this.repository.upsertMany(
      items.map((item) => mapPlayerGameweekStats(item, now)),
      manager,
    );
  }
}