import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApiElementType } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { ElementTypesRepository } from './element-types.repository';
import { mapElementType } from './element-types.mapper';

@Injectable()
export class ElementTypesService {
  constructor(private readonly repository: ElementTypesRepository) {}

  /** Приводит ответ API к строкам и делает upsert по id. Возвращает число строк. */
  upsertFromApi(items: ApiElementType[], manager?: EntityManager): Promise<number> {
    const now = new Date();
    return this.repository.upsertMany(
      items.map((item) => mapElementType(item, now)),
      manager,
    );
  }
}
