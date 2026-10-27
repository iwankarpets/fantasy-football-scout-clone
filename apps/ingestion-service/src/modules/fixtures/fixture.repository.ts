import { Injectable } from '@nestjs/common';
import { EntityManager } from "typeorm/entity-manager/EntityManager.js";
import { Fixture } from "../../database/entities/fixture.entity";

@Injectable()
export class FixtureRepository {
  async upsertMany(rows: Partial<Fixture>[], manager: EntityManager): Promise<number> {
    if (rows.length === 0) return 0;
    await manager.upsert(Fixture, rows, ['id']);
    return rows.length;
  }
}