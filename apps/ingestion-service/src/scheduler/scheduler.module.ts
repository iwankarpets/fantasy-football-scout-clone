import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsModule } from '../jobs/jobs.module';
import { IngestionProcessor } from './ingestion.processor';
import { INGESTION_QUEUE } from './scheduler.constants';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [BullModule.registerQueue({ name: INGESTION_QUEUE }), JobsModule],
  providers: [IngestionProcessor, SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}