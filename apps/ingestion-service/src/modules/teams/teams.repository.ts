import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Team } from '../../database/entities/team.entity';
import { upsertInChunks } from '../../database/upsert.util';

@Injectable()
export class TeamsRepository {
  constructor(@InjectRepository(Team) private readonly repo: Repository<Team>) {}

  /** Передайте manager, чтобы выполнить upsert внутри внешней транзакции. */
  upsertMany(rows: Team[], manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(Team) : this.repo;
    return upsertInChunks(repo, rows, ['id']);
  }
}
