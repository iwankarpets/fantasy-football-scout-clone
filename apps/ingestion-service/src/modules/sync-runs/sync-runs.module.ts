import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncRun } from '../../database/entities/sync-run.entity';
import { SyncRunsRepository } from './sync-runs.repository';
import { SyncRunsService } from './sync-runs.service';

@Module({
  imports: [TypeOrmModule.forFeature([SyncRun])],
  providers: [SyncRunsRepository, SyncRunsService],
  exports: [SyncRunsService],
})
export class SyncRunsModule {}
