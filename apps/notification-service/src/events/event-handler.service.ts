import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ParsedEvent } from '@app/messaging';
import { PlayerEventsService } from '../modules/notifications/player-events.service';
import { UserSyncService } from '../modules/recipients/user-sync.service';
import { ProcessedEventsRepository } from './processed-events.repository';

/** Одна транзакция на событие: отметка в processed_events + действие. */
@Injectable()
export class EventHandler {
  private readonly logger = new Logger(EventHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly processed: ProcessedEventsRepository,
    private readonly userSync: UserSyncService,
    private readonly playerEvents: PlayerEventsService,
  ) {}

  async handle(event: ParsedEvent): Promise<void> {
    await this.dataSource.transaction(async (m) => {
      const isNew = await this.processed.markProcessed(event.event_id, m);
      if (!isNew) {
        this.logger.warn(`Duplicate ${event.type} ${event.event_id}, skipped`);
        return;
      }
      if (event.type.startsWith('user.')) {
        await this.userSync.apply(event, m);
      } else {
        await this.playerEvents.apply(event, m);
      }
    });
  }
}
