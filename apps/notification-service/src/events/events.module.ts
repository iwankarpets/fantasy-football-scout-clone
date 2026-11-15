import { Module } from '@nestjs/common';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { RecipientsRepository } from '../modules/recipients/recipients.repository';
import { UserSyncService } from '../modules/recipients/user-sync.service';
import { WatchRefsRepository } from '../modules/watch-refs/watch-refs.repository';
import { UserEventsConsumer } from './consumers/user-events.consumer';
import { EventHandler } from './event-handler.service';
import { ProcessedEventsRepository } from './processed-events.repository';

@Module({
  imports: [NotificationsModule],
  providers: [
    ProcessedEventsRepository,
    RecipientsRepository,
    WatchRefsRepository,
    UserSyncService,
    EventHandler,
    UserEventsConsumer,
  ],
})
export class EventsModule {}
