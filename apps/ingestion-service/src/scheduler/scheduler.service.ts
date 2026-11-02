import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INGESTION_QUEUE, SCHEDULES } from './scheduler.constants';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue(INGESTION_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.config.getOrThrow<boolean>('scheduler.enabled');

    if (!enabled) {
      // Планировщики хранятся в Redis и переживают перезапуск, поэтому при выключении снимаем их
      for (const s of SCHEDULES) await this.queue.removeJobScheduler(s.id);
      this.logger.log('Расписание выключено (SCHEDULER_ENABLED не true), задачи сняты');
      return;
    }

    for (const s of SCHEDULES) {
      await this.queue.upsertJobScheduler(s.id, s.repeat, {
        name: s.jobName,
        data: {},
        opts: s.opts,
      });
    }
    this.logger.log(`Расписание включено: ${SCHEDULES.map((s) => s.id).join(', ')}`);
  }

  /** Для проверки: какие планировщики есть и когда следующий запуск. */
  async list() {
    const items = await this.queue.getJobSchedulers();
    return items.map((s) => ({
      id: s.key,
      name: s.name,
      every: s.every,
      pattern: s.pattern,
      next: s.next ? new Date(s.next).toISOString() : null,
    }));
  }
}