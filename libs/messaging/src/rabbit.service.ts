import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { parseEvent, ParseResult } from '@app/contracts';
import { MESSAGING_OPTIONS, MessagingOptions } from './messaging.options';
import { assertTopology, DEAD_LETTER_EXCHANGE, EVENTS_EXCHANGE } from './topology';

export type ParsedEvent = Extract<ParseResult, { ok: true }>['event'];

export interface SubscribeOptions {
  /** Своя очередь у каждого получателя, например 'analytics.events'. */
  queue: string;
  /** Типы событий, например ['snapshot.ready', 'player.price_changed']. */
  routingKeys: string[];
  /** Если бросит ошибку, сообщение уйдёт в DLQ. Идемпотентность (processed_events) делает сам получатель. */
  handler: (event: ParsedEvent) => Promise<void>;
  prefetch?: number;
}

@Injectable()
export class RabbitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitService.name);
  private connection!: AmqpConnectionManager;
  private publisher!: ChannelWrapper;
  private readonly consumers: ChannelWrapper[] = [];

  constructor(@Inject(MESSAGING_OPTIONS) private readonly options: MessagingOptions) {}

  onModuleInit(): void {
    this.connection = connect([this.options.url]);
    this.connection.on('connect', () => this.logger.log('RabbitMQ: подключено'));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`RabbitMQ: соединение потеряно: ${err?.message ?? 'unknown'}`),
    );

    // Не ждём подключения: сервис стартует, даже если брокер ещё недоступен
    this.publisher = this.connection.createChannel({
      json: true,
      publishTimeout: this.options.publishTimeoutMs ?? 10_000,
      setup: (ch: ConfirmChannel) => assertTopology(ch),
    });
  }

  /**
   * Публикует конверт события. Промис завершается, когда брокер подтвердил приём,
   * при недоступности брокера он отклоняется по таймауту (строка outbox останется неотправленной).
   */
  async publish(event: { event_id: string; type: string; occurred_at: string }): Promise<void> {
    await this.publisher.publish(EVENTS_EXCHANGE, event.type, event, {
      persistent: true,
      messageId: event.event_id,
      type: event.type,
      contentType: 'application/json',
      timestamp: Date.parse(event.occurred_at),
    });
  }

  /** Подписка получателя. Неверный формат или ошибка обработчика: nack без requeue, сообщение уходит в DLQ. */
  subscribe(opts: SubscribeOptions): void {
    const wrapper = this.connection.createChannel({
      setup: async (ch: ConfirmChannel) => {
        await assertTopology(ch);
        await ch.assertQueue(opts.queue, {
          durable: true,
          arguments: { 'x-dead-letter-exchange': DEAD_LETTER_EXCHANGE },
        });
        for (const key of opts.routingKeys) {
          await ch.bindQueue(opts.queue, EVENTS_EXCHANGE, key);
        }
        await ch.prefetch(opts.prefetch ?? 10);
        await ch.consume(opts.queue, (msg) => void this.onMessage(ch, msg, opts));
      },
    });
    this.consumers.push(wrapper);
  }

  private async onMessage(ch: ConfirmChannel, msg: ConsumeMessage | null, opts: SubscribeOptions) {
    if (!msg) return; // consumer отменён брокером

    let raw: unknown;
    try {
      raw = JSON.parse(msg.content.toString('utf8'));
    } catch {
      this.logger.error(`[${opts.queue}] не JSON, в DLQ`);
      ch.nack(msg, false, false);
      return;
    }

    const parsed = parseEvent(raw);
    if (!parsed.ok) {
      this.logger.error(`[${opts.queue}] неверный формат, в DLQ: ${parsed.reason}`);
      ch.nack(msg, false, false);
      return;
    }

    try {
      await opts.handler(parsed.event);
      ch.ack(msg);
    } catch (e) {
      this.logger.error(`[${opts.queue}] ошибка обработки ${parsed.event.type}: ${(e as Error).message}`);
      ch.nack(msg, false, false);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.publisher?.close(), ...this.consumers.map((c) => c.close())]);
    await this.connection?.close();
  }
}