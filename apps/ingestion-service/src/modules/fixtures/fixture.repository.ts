import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Fixture } from '../../database/entities/fixture.entity';
import { upsertInChunks } from '../../database/upsert.util';

@Injectable()
export class FixturesRepository {
  constructor(@InjectRepository(Fixture) private readonly repo: Repository<Fixture>) {}

  /** Передайте manager, чтобы выполнить upsert внутри внешней транзакции. */
  upsertMany(rows: Fixture[], manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(Fixture) : this.repo;
    return upsertInChunks(repo, rows, ['id']);
  }
}