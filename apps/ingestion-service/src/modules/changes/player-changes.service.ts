import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PlayerChangeRow } from './player-changes.detector';
import { PlayerChangesRepository } from './player-changes.repository';

@Injectable()
export class PlayerChangesService {
  constructor(private readonly repository: PlayerChangesRepository) {}

  record(rows: PlayerChangeRow[], manager?: EntityManager): Promise<number> {
    return this.repository.insertMany(rows, manager);
  }
}