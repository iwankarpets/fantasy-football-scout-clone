import { Module } from '@nestjs/common';
import { SyncModule } from '../modules/sync/sync.module'; // экспортирует SyncService
import { MetricsModule } from '../modules/metrics/metrics.module'; // экспортирует MetricsService
// TODO: если SnapshotReadyHandler уже объявлен в providers другого модуля, убери его оттуда
import { SnapshotReadyHandler } from '../modules/sync/snapshot-ready.handler';
import { AnalyticsEventsConsumer } from './consumers/analytics-events.consumer';
import { EventHandler } from './event-handler.service';
import { ProcessedEventsRepository } from './processed-events.repository';

@Module({
  imports: [SyncModule, MetricsModule],
  providers: [
    ProcessedEventsRepository,
    SnapshotReadyHandler,
    EventHandler,
    AnalyticsEventsConsumer,
  ],
})
export class EventsModule {}
