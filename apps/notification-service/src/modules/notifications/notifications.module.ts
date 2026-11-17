import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { NotificationsRepository } from './notifications.repository';
import { PlayerEventsService } from './player-events.service';
import { TelegramSender } from './telegram-sender';
import { DeadlineEventsService } from './deadline-events.service';

@Module({
  providers: [
    NotificationsRepository,
    PlayerEventsService,
    TelegramSender,
    DeliveryService,
    DeadlineEventsService,
  ],
  exports: [PlayerEventsService, DeadlineEventsService],
})
export class NotificationsModule {}
