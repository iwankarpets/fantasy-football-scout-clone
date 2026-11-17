import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ParsedEvent } from '@app/messaging';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class DeadlineEventsService {
  private readonly logger = new Logger(DeadlineEventsService.name);

  constructor(private readonly notifications: NotificationsRepository) {}

  async apply(event: ParsedEvent, m: EntityManager): Promise<void> {
    if (event.type !== 'gameweek.deadline_approaching') {
      return;
    }
    const d = event.data;
    const created = await this.notifications.createDeadlineReminders(
      {
        gameweek: d.gameweek_number,
        hoursLeft: d.hours_left,
        payload: { ...d },
      },
      m,
    );
    this.logger.log(
      `GW${d.gameweek_number} deadline ${d.hours_left}h: ${created} reminders queued`,
    );
  }
}
