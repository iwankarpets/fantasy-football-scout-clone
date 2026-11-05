import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsModule } from '../jobs/jobs.module';
import { DeadlineProcessor } from './deadline.processor';
import { IngestionProcessor } from './ingestion.processor';
import { DEADLINE_QUEUE, INGESTION_QUEUE } from './scheduler.constants';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: INGESTION_QUEUE }, { name: DEADLINE_QUEUE }),
    JobsModule,
  ],
  providers: [IngestionProcessor, DeadlineProcessor, SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}