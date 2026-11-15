import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { NOTIFICATION_QUEUE, RabbitService } from '@app/messaging';
import { EventHandler } from '../event-handler.service';

@Injectable()
export class UserEventsConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly rabbit: RabbitService,
    private readonly handler: EventHandler,
  ) {}

  onApplicationBootstrap(): void {
    this.rabbit.subscribe({
      queue: NOTIFICATION_QUEUE,
      handler: (event) => this.handler.handle(event),
    });
  }
}
