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
    const q = this.queues[name];
    if (!q) throw new Error(`Неизвестная очередь: ${name}`);
    return q;
  }

  async onModuleInit(): Promise<void> {
    const enabled = this.config.getOrThrow<boolean>('scheduler.enabled');

    if (!enabled) {
      // Планировщики хранятся в Redis и переживают перезапуск, поэтому при выключении снимаем их
      for (const s of SCHEDULES) await this.queueFor(s.queue).removeJobScheduler(s.id);
      this.logger.log('Расписание выключено (SCHEDULER_ENABLED не true), задачи сняты');
      return;
    }

    for (const s of SCHEDULES) {
      await this.queueFor(s.queue).upsertJobScheduler(s.id, s.repeat, {
        name: s.jobName,
        data: {},
        opts: s.opts,
      });
    }
    this.logger.log(`Расписание включено: ${SCHEDULES.map((s) => s.id).join(', ')}`);
  }

  /** Для проверки: какие планировщики есть и когда следующий запуск. */
  async list() {
    const result: { queue: string; id: string; name: string; every?: number | null; pattern?: string | null; next: string | null }[] = [];
    for (const [queue, q] of Object.entries(this.queues)) {
      const items = await q.getJobSchedulers();
      for (const s of items) {
        result.push({
          queue,
          id: s.key,
          name: s.name,
          every: s.every,
          pattern: s.pattern,
          next: s.next ? new Date(s.next).toISOString() : null,
        });
      }
    }
    return result;
  }
}