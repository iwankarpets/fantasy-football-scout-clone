import { Injectable } from '@nestjs/common';
import { SyncRunStatus } from '../../database/entities/sync-run.entity';
import { SyncRunsRepository } from './sync-runs.repository';

@Injectable()
export class SyncRunsService {
  constructor(private readonly repository: SyncRunsRepository) {}

  start(endpoint: string): Promise<number> {
    return this.repository.create(endpoint);
  }

  finish(
    id: number,
    patch: { status: SyncRunStatus; itemsCount?: number; payloadHash?: string; error?: string },
  ): Promise<void> {
    return this.repository.finish(id, patch);
  }

  lastSuccessHash(endpoint: string): Promise<string | null> {
    return this.repository.findLastSuccessHash(endpoint);
  }
}
