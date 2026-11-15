import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ParsedEvent } from '@app/messaging';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class PlayerEventsService {
  private readonly logger = new Logger(PlayerEventsService.name);

  constructor(private readonly notifications: NotificationsRepository) {}

  async apply(event: ParsedEvent, m: EntityManager): Promise<void> {
    switch (event.type) {
      case 'player.status_changed': {
        const d = event.data;
        const created = await this.notifications.createForWatchers(
          {
            playerId: d.player_id,
            type: 'player_status',
            settingColumn: 'notify_injuries',
            eventId: event.event_id,
            payload: { ...d },
          },
          m,
        );
        this.logger.log(`player ${d.player_id} status: ${created} notifications queued`);
        break;
      }
      case 'player.price_changed': {
        const d = event.data;
        const created = await this.notifications.createForWatchers(
          {
            playerId: d.player_id,
            type: 'player_price',
            settingColumn: 'notify_price',
            eventId: event.event_id,
            payload: { ...d },
          },
          m,
        );
        this.logger.log(`player ${d.player_id} price: ${created} notifications queued`);
        break;
      }
      default:
        break;
    }
  }
}
