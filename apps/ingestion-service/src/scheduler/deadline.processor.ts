import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DeadlineCheckJob } from '../jobs/deadline-check.job';
import { DEADLINE_QUEUE, JOB_DEADLINE_CHECK } from './scheduler.constants';

@Processor(DEADLINE_QUEUE)
export class DeadlineProcessor extends WorkerHost {
  private readonly logger = new Logger(DeadlineProcessor.name);

  constructor(private readonly deadline: DeadlineCheckJob) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    if (job.name !== JOB_DEADLINE_CHECK) throw new Error(`Неизвестная задача: ${job.name}`);
    const result = await this.deadline.run();
    this.logger.debug(`deadline-check: ${JSON.stringify(result)}`);
    return result;
  }
}