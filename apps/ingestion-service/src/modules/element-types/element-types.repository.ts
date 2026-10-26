import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ElementType } from '../../database/entities/element-type.entity';
import { upsertInChunks } from '../../database/upsert.util';

@Injectable()
export class ElementTypesRepository {
  constructor(@InjectRepository(ElementType) private readonly repo: Repository<ElementType>) {}

  /** Передайте manager, чтобы выполнить upsert внутри внешней транзакции. */
  upsertMany(rows: ElementType[], manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(ElementType) : this.repo;
    return upsertInChunks(repo, rows, ['id']);
  }
}
