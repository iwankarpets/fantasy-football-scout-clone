import { Module } from '@nestjs/common';

/** outbox (запись событий в одной транзакции с данными) и publishers (отправка в RabbitMQ). */
@Module({})
export class EventsModule {}