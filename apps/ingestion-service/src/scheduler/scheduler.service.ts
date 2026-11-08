import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DEADLINE_QUEUE, INGESTION_QUEUE, SCHEDULES } from './scheduler.constants';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly queues: Record<string, Queue>;

  constructor(
    @InjectQueue(INGESTION_QUEUE) ingestionQueue: Queue,
    @InjectQueue(DEADLINE_QUEUE) deadlineQueue: Queue,
    private readonly config: ConfigService,
  ) {
    this.queues = { [INGESTION_QUEUE]: ingestionQueue, [DEADLINE_QUEUE]: deadlineQueue };
  }

  private queueFor(name: string): Queue {
    const queue = this.queues[name];
    if (!queue) {
      throw new Error(`Unknown queue: ${name}`);
    }
    return queue;
  }

  async onModuleInit(): Promise<void> {
    const enabled = this.config.getOrThrow<boolean>('scheduler.enabled');

    if (!enabled) {
      // Schedulers are stored in Redis and survive restarts, so we remove them when disabled
      for (const schedule of SCHEDULES) {
        await this.queueFor(schedule.queue).removeJobScheduler(schedule.id);
      }
      this.logger.log('Schedule is disabled (SCHEDULER_ENABLED is not true), tasks removed');
      return;
    }

    for (const schedule of SCHEDULES) {
      await this.queueFor(schedule.queue).upsertJobScheduler(schedule.id, schedule.repeat, {
        name: schedule.jobName,
        data: {},
        opts: schedule.opts,
      });
    }
    this.logger.log(`Schedule enabled: ${SCHEDULES.map((schedule) => schedule.id).join(', ')}`);
  }

  /** For inspection: lists existing schedulers and their next run time. */
  async list() {
    const result: {
      queue: string;
      id: string;
      name: string;
      every?: number | null;
      pattern?: string | null;
      next: string | null;
    }[] = [];
    for (const [queue, q] of Object.entries(this.queues)) {
      const items = await q.getJobSchedulers();
      for (const schedule of items) {
        result.push({
          queue,
          id: schedule.key,
          name: schedule.name,
          every: schedule.every,
          pattern: schedule.pattern,
          next: schedule.next ? new Date(schedule.next).toISOString() : null,
        });
      }
    }
    return result;
  }
}
