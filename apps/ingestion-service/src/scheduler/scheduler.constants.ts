import type { JobsOptions } from 'bullmq';

export const INGESTION_QUEUE = 'ingestion';

export const JOB_SYNC_BOOTSTRAP = 'sync-bootstrap';
export const JOB_SYNC_FIXTURES = 'sync-fixtures';
export const JOB_DAILY_SNAPSHOT = 'daily-snapshot';

/** Задачи, которые ходят к FPL: при ошибке (в том числе 403) ждём подольше. */
const NETWORK_JOB_OPTS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5 * 60_000 },
  removeOnComplete: 50,
  removeOnFail: 100,
};

/** Задачи только по своей базе: быстрый повтор. */
const LOCAL_JOB_OPTS: JobsOptions = {
  attempts: 2,
  backoff: { type: 'fixed', delay: 60_000 },
  removeOnComplete: 50,
  removeOnFail: 100,
};

export interface ScheduleDef {
  /** Уникальный id планировщика: повторный upsert обновляет его, а не создаёт дубль */
  id: string;
  jobName: string;
  repeat: { every: number } | { pattern: string; tz?: string };
  opts: JobsOptions;
}

export const SCHEDULES: ScheduleDef[] = [
  {
    id: 'sync-bootstrap-every-20m',
    jobName: JOB_SYNC_BOOTSTRAP,
    repeat: { every: 20 * 60_000 },
    opts: NETWORK_JOB_OPTS,
  },
  {
    id: 'sync-fixtures-every-3h',
    jobName: JOB_SYNC_FIXTURES,
    repeat: { every: 3 * 60 * 60_000 },
    opts: NETWORK_JOB_OPTS,
  },
  {
    // TODO: подобрать час по реальному времени смены цен (запрос в конце сообщения)
    id: 'daily-snapshot-0600-utc',
    jobName: JOB_DAILY_SNAPSHOT,
    repeat: { pattern: '0 0 6 * * *', tz: 'UTC' },
    opts: LOCAL_JOB_OPTS,
  },
];