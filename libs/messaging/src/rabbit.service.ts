import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { parseEvent, ParseResult } from '@app/contracts';
import { MESSAGING_OPTIONS, MessagingOptions } from './messaging.options';
import { assertTopology, EVENTS_EXCHANGE } from './topology';

export type ParsedEvent = Extract<ParseResult, { ok: true }>['event'];

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

export interface SubscribeOptions {
  /** Each consumer has its own queue, e.g., 'analytics.events'. */
  queue: string;
  /** Event types, e.g., ['snapshot.ready', 'player.price_changed']. */
  //routingKeys: string[];
  /**
   * If the handler throws, it is retried (maxAttempts in total, with a growing pause).
   * After the last failed attempt the message goes to the DLQ.
   * Retries are safe: idempotency (processed_events) is handled by the consumer itself.
   */
  handler: (event: ParsedEvent) => Promise<void>;
  prefetch?: number;
  /** Total number of handler attempts, including the first one. Default 3; 1 disables retries. */
  maxAttempts?: number;
  /** Pause before the second attempt in ms; doubles on every next attempt. Default 1000. */
  retryDelayMs?: number;
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

  /** Consumer subscription. Invalid format: nack without requeue (DLQ). Handler error: retries, then DLQ. */
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
      this.settle(() => ch.nack(msg, false, false), opts.queue);
      return;
    }

    const parsed = parseEvent(raw);
    if (!parsed.ok) {
      this.logger.error(`[${opts.queue}] invalid format, sending to DLQ: ${parsed.reason}`);
      this.settle(() => ch.nack(msg, false, false), opts.queue);
      return;
    }

    const maxAttempts = Math.max(1, opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
    const baseDelayMs = opts.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await opts.handler(parsed.event);
        lastError = undefined;
        break;
      } catch (e) {
        lastError = e as Error;
        if (attempt < maxAttempts) {
          const delay = baseDelayMs * 2 ** (attempt - 1);
          this.logger.warn(
            `[${opts.queue}] ${parsed.event.type} failed (attempt ${attempt}/${maxAttempts}), retry in ${delay} ms: ${lastError.message}`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (lastError) {
      this.logger.error(
        `[${opts.queue}] error processing ${parsed.event.type} after ${maxAttempts} attempts, sending to DLQ: ${lastError.message}`,
      );
      this.settle(() => ch.nack(msg, false, false), opts.queue);
    } else {
      this.settle(() => ch.ack(msg), opts.queue);
    }
  }

  /**
   * ack/nack throws if the channel closed while the handler was running (connection lost).
   * The broker redelivers such a message itself, so it is enough to log it.
   */
  private settle(action: () => void, queue: string): void {
    try {
      action();
    } catch (e) {
      this.logger.warn(
        `[${queue}] could not ack/nack, broker will redeliver: ${(e as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.publisher?.close(), ...this.consumers.map((c) => c.close())]);
    await this.connection?.close();
  }
}
