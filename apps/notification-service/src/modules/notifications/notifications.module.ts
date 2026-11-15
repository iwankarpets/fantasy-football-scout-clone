import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { NotificationsRepository } from './notifications.repository';
import { PlayerEventsService } from './player-events.service';
import { TelegramSender } from './telegram-sender';

@Module({
  providers: [NotificationsRepository, PlayerEventsService, TelegramSender, DeliveryService],
  exports: [PlayerEventsService],
})
export class NotificationsModule {}
