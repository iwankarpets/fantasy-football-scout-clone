import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngestionApiClient } from '../../clients/ingestion-api/ingestion-api.client';
import { SyncController } from './sync.controller';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { SyncService } from './sync.service';
import { SnapshotReadyHandler } from './snapshot-ready.handler';

@Module({
  imports: [ConfigModule],
  controllers: [SyncController],
  providers: [IngestionApiClient, InternalApiKeyGuard, SyncService, SnapshotReadyHandler],
  exports: [SyncService, SnapshotReadyHandler],
})
export class SyncModule {}
