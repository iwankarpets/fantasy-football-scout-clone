import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ANALYTICS_QUEUE, RabbitService } from '@app/messaging';
import { EventHandler } from '../event-handler.service';

@Injectable()
export class AnalyticsEventsConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly rabbit: RabbitService,
    private readonly handler: EventHandler,
  ) {}

  onApplicationBootstrap(): void {
    this.rabbit.subscribe({
      queue: ANALYTICS_QUEUE,
      handler: (event) => this.handler.handle(event),
    });
  }
}
