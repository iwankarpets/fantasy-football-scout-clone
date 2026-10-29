import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PlayerGameweekStats } from '../../database/entities/player-gameweek-stats.entity';
import { upsertInChunks } from '../../database/upsert.util';
import { PlayerGameweekStatsRow } from './player-gameweek-stats.mapper';

@Injectable()
export class PlayerGameweekStatsRepository {
  constructor(
    @InjectRepository(PlayerGameweekStats) private readonly repo: Repository<PlayerGameweekStats>,
  ) {}

  /** Конфликт по (element, fixture): так спаренные туры дают две строки, а не перезапись. */
  upsertMany(rows: PlayerGameweekStatsRow[], manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(PlayerGameweekStats) : this.repo;
    return upsertInChunks(repo, rows as PlayerGameweekStats[], ['element', 'fixture']);
  }
}