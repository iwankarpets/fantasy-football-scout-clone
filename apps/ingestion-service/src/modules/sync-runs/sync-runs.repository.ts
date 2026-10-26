import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncRun, SyncRunStatus } from '../../database/entities/sync-run.entity';

@Injectable()
export class SyncRunsRepository {
  constructor(@InjectRepository(SyncRun) private readonly repo: Repository<SyncRun>) {}

  async create(endpoint: string): Promise<number> {
    const run = await this.repo.save(this.repo.create({ endpoint, status: 'running' }));
    return run.id;
  }

  async finish(
    id: number,
    patch: { status: SyncRunStatus; itemsCount?: number; payloadHash?: string; error?: string },
  ): Promise<void> {
    await this.repo.update(id, {
      status: patch.status,
      finished_at: new Date(),
      items_count: patch.itemsCount ?? null,
      payload_hash: patch.payloadHash ?? null,
      error: patch.error ?? null,
    });
  }

  async findLastSuccessHash(endpoint: string): Promise<string | null> {
    const run = await this.repo.findOne({
      where: { endpoint, status: 'success' },
      order: { started_at: 'DESC' },
    });
    return run?.payload_hash ?? null;
  }
}
