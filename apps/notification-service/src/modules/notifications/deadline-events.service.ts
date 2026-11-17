import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ParsedEvent } from '@app/messaging';
import { NotificationsRepository } from './notifications.repository';
import { GAMWEEK_DEADLINE_APPROACHING } from '@app/contracts';

@Injectable()
export class DeadlineEventsService {
  private readonly logger = new Logger(DeadlineEventsService.name);

  constructor(private readonly notifications: NotificationsRepository) {}

  async apply(event: ParsedEvent, manager: EntityManager): Promise<void> {
    if (event.type !== GAMWEEK_DEADLINE_APPROACHING) {
      return;
    }
    const data = event.data;
    const created = await this.notifications.createDeadlineReminders(
      {
        gameweek: data.gameweek_number,
        hoursLeft: data.hours_left,
        payload: { ...data },
      },
      manager,
    );
    this.logger.log(
      `GW${data.gameweek_number} deadline ${data.hours_left}h: ${created} reminders queued`,
    );
  }
}
