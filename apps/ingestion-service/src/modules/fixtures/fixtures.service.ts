import { Injectable } from '@nestjs/common';
import { EntityManager } from "typeorm/entity-manager/EntityManager.js";
import { FplFixture } from "../../clients/fpl-api/schemas/fixtures.schema";
import { FixtureRepository } from "./fixture.repository";
import { mapFixture } from "./fixture.mapper";

@Injectable()
export class FixturesService {
  constructor(private readonly repository: FixtureRepository) {}

  upsertFromApi(items: FplFixture[], manager: EntityManager): Promise<number> {
    return this.repository.upsertMany(items.map(mapFixture), manager);
  }
}