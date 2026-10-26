import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Gameweek } from '../../database/entities/gameweek.entity';
import { upsertInChunks } from '../../database/upsert.util';

@Injectable()
export class GameweeksRepository {
  constructor(@InjectRepository(Gameweek) private readonly repo: Repository<Gameweek>) {}

  /** Передайте manager, чтобы выполнить upsert внутри внешней транзакции. */
  upsertMany(rows: Gameweek[], manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(Gameweek) : this.repo;
    return upsertInChunks(repo, rows, ['id']);
  }
}
