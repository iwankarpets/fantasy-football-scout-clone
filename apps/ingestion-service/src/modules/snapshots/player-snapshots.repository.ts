import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { PlayerSnapshot } from '../../database/entities/player-snapshot.entity';
import { PlayerSnapshotRow } from './player-snapshots.mapper';

const CHUNK_SIZE = 500;

@Injectable()
export class PlayerSnapshotsRepository {
  constructor(
    @InjectRepository(PlayerSnapshot)
    private readonly playerShapshotRepository: Repository<PlayerSnapshot>,
  ) {}

  /** Есть ли уже снимки за этот день (границы суток в UTC). */
  async existsForDay(start: Date, end: Date): Promise<boolean> {
    const count = await this.playerShapshotRepository
      .createQueryBuilder('s')
      .where('s.captured_at >= :start AND s.captured_at < :end', { start, end })
      .getCount();
    return count > 0;
  }

  async deleteForDay(start: Date, end: Date, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(PlayerSnapshot) : this.playerShapshotRepository;
    await repo
      .createQueryBuilder()
      .delete()
      .where('captured_at >= :start AND captured_at < :end', { start, end })
      .execute();
  }

  /** Обычный insert: каждый снимок это новая запись истории. */
  async insertMany(rows: PlayerSnapshotRow[], manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(PlayerSnapshot) : this.playerShapshotRepository;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE) as QueryDeepPartialEntity<PlayerSnapshot>[];
      await repo.insert(chunk);
    }
    return rows.length;
  }
}
