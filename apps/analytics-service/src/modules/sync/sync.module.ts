import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngestionApiClient } from '../../clients/ingestion-api/ingestion-api.client';
import { MetricsModule } from '../metrics/metrics.module';
import { SnapshotReadyHandler } from './snapshot-ready.handler';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';

@Module({
  imports: [ConfigModule, MetricsModule],
  controllers: [SyncController],
  providers: [IngestionApiClient, InternalApiKeyGuard, SyncService, SnapshotReadyHandler],
  exports: [SyncService, SnapshotReadyHandler],
})
export class SyncModule {}
