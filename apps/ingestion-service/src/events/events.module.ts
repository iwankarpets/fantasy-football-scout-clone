import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from '../database/entities/outbox-event.entity';
import { OutboxService } from './outbox/outbox.service';
import { OutboxPublisher } from './publishers/outbox.publisher';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  providers: [OutboxService, OutboxPublisher],
  exports: [OutboxService],
})
export class EventsModule {}
