import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { DeadlineApproachingV1 } from '@app/contracts';
import { OutboxService } from '../events/outbox/outbox.service';
import { GameweeksService } from '../modules/gameweeks/gameweeks.service';
import { deadlineDedupKey, pickReminderThreshold } from '../utils/deadline-reminders';

export type DeadlineCheckResult =
  | { status: 'no_deadline' }
  | { status: 'not_due'; gameweek: number }
  | { status: 'already_sent' | 'published'; gameweek: number; hours: number };

/** Работает только по базе, FPL не трогает. Повторный запуск безопасен: дубли гасит dedup_key. */
@Injectable()
export class DeadlineCheckJob {
  private readonly logger = new Logger(DeadlineCheckJob.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly gameweeks: GameweeksService,
    private readonly outbox: OutboxService,
  ) {}

  /** now можно передать для ручной проверки. */
  async run(opts: { now?: Date } = {}): Promise<DeadlineCheckResult> {
    const now = opts.now ?? new Date();

    const gw = await this.gameweeks.nextDeadline(now);
    if (!gw) return { status: 'no_deadline' };

    const hours = pickReminderThreshold(now.getTime() / 1000, gw.deadline_time_epoch);
    if (hours === null) return { status: 'not_due', gameweek: gw.id };

    const created = await this.dataSource.transaction((manager) =>
      this.outbox.add(
        DeadlineApproachingV1,
        {
          gameweek_number: gw.id,
          deadline_at: gw.deadline_time.toISOString(),
          hours_left: hours,
        },
        manager,
        {
          correlationId: randomUUID(),
          dedupKey: deadlineDedupKey(gw.id, gw.deadline_time_epoch, hours),
        },
      ),
    );

    if (created) this.logger.log(`GW${gw.id}: напоминание за ${hours} ч поставлено в outbox`);
    return { status: created ? 'published' : 'already_sent', gameweek: gw.id, hours };
  }
}