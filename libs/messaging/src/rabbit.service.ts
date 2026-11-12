import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { parseEvent, ParseResult } from '@app/contracts';
import { MESSAGING_OPTIONS, MessagingOptions } from './messaging.options';
import { assertTopology, DEAD_LETTER_EXCHANGE, EVENTS_EXCHANGE } from './topology';

export type ParsedEvent = Extract<ParseResult, { ok: true }>['event'];

export interface SubscribeOptions {
  /** Each consumer has its own queue, e.g., 'analytics.events'. */
  queue: string;
  /** Event types, e.g., ['snapshot.ready', 'player.price_changed']. */
  routingKeys: string[];
  /** If an error is thrown, the message goes to the DLQ. Idempotency (processed_events) is handled by the consumer itself. */
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
    this.connection.on('connect', () => this.logger.log('RabbitMQ: connected'));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`RabbitMQ: connection lost: ${err?.message ?? 'unknown'}`),
    );

    // Do not wait for connection: the service starts even if the broker is not yet available
    this.publisher = this.connection.createChannel({
      json: true,
      publishTimeout: this.options.publishTimeoutMs ?? 10_000,
      setup: (ch: ConfirmChannel) => assertTopology(ch),
    });
  }

  /**
   * Publishes the event envelope. The promise resolves when the broker confirms receipt;
   * if the broker is unavailable, it rejects by timeout (the outbox row remains unsent).
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

  /** Consumer subscription. Invalid format or handler error: nack without requeue, message goes to the DLQ. */
  subscribe(opts: SubscribeOptions): void {
    const wrapper = this.connection.createChannel({
      setup: async (ch: ConfirmChannel) => {
        await assertTopology(ch);
        await ch.prefetch(opts.prefetch ?? 1);
        await ch.consume(opts.queue, (msg) => void this.onMessage(ch, msg, opts));
      },
    });
    this.consumers.push(wrapper);
  }

  private async onMessage(ch: ConfirmChannel, msg: ConsumeMessage | null, opts: SubscribeOptions) {
    if (!msg) {
      return; // consumer canceled by the broker
    }

    let raw: unknown;
    try {
      raw = JSON.parse(msg.content.toString('utf8'));
    } catch {
      this.logger.error(`[${opts.queue}] not JSON, sending to DLQ`);
      ch.nack(msg, false, false);
      return;
    }

    const parsed = parseEvent(raw);
    if (!parsed.ok) {
      this.logger.error(`[${opts.queue}] invalid format, sending to DLQ: ${parsed.reason}`);
      ch.nack(msg, false, false);
      return;
    }

    try {
      await opts.handler(parsed.event);
      ch.ack(msg);
    } catch (e) {
      this.logger.error(
        `[${opts.queue}] error processing ${parsed.event.type}: ${(e as Error).message}`,
      );
      ch.nack(msg, false, false);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.publisher?.close(), ...this.consumers.map((c) => c.close())]);
    await this.connection?.close();
  }
}
