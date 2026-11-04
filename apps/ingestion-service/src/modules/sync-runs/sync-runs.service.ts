import { Injectable } from '@nestjs/common';
import { SyncRunStatus } from '../../database/entities/sync-run.entity';
import { SyncRunsRepository } from './sync-runs.repository';
import { EntityManager } from 'typeorm';

@Injectable()
export class SyncRunsService {
  constructor(private readonly repository: SyncRunsRepository) {}

  start(endpoint: string): Promise<number> {
    return this.repository.create(endpoint);
  }

  finish(
    id: number,
    patch: { status: SyncRunStatus; itemsCount?: number; payloadHash?: string; error?: string },
    manager?: EntityManager,
  ): Promise<void> {
    return this.repository.finish(id, patch, manager);
  }

  lastSuccessHash(endpoint: string): Promise<string | null> {
    return this.repository.findLastSuccessHash(endpoint);
  }
}
