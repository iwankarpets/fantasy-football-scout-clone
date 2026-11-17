import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ParsedEvent } from '@app/messaging';
import { NotificationsRepository } from './notifications.repository';
import { PLAYER_PRICE_CHANGED, PLAYER_STATUS_CHANGED } from '@app/contracts';

@Injectable()
export class PlayerEventsService {
  private readonly logger = new Logger(PlayerEventsService.name);

  constructor(private readonly notifications: NotificationsRepository) {}

  async apply(event: ParsedEvent, manager: EntityManager): Promise<void> {
    switch (event.type) {
      case PLAYER_STATUS_CHANGED: {
        const data = event.data;
        const created = await this.notifications.createForWatchers(
          {
            playerId: data.player_id,
            type: 'player_status',
            settingColumn: 'notify_injuries',
            eventId: event.event_id,
            payload: { ...data },
          },
          manager,
        );
        this.logger.log(`player ${data.player_id} status: ${created} notifications queued`);
        break;
      }
      case PLAYER_PRICE_CHANGED: {
        const data = event.data;
        const created = await this.notifications.createForWatchers(
          {
            playerId: data.player_id,
            type: 'player_price',
            settingColumn: 'notify_price',
            eventId: event.event_id,
            payload: { ...data },
          },
          manager,
        );
        this.logger.log(`player ${data.player_id} price: ${created} notifications queued`);
        break;
      }
      default:
        break;
    }
  }
}
