import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryDeepPartialEntity, Repository } from 'typeorm';
import { PlayerChange } from '../../database/entities/player-change.entity';
import { PlayerChangeRow } from './player-changes.detector';

const CHUNK_SIZE = 500;

@Injectable()
export class PlayerChangesRepository {
  constructor(@InjectRepository(PlayerChange) private readonly repo: Repository<PlayerChange>) {}

  /** Обычный insert (не upsert): каждое изменение это новая запись истории. */
  async insertMany(rows: PlayerChangeRow[], manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(PlayerChange) : this.repo;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE) as QueryDeepPartialEntity<PlayerChange>[];
      await repo.insert(chunk);
    }
    return rows.length;
  }
}