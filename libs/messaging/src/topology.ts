import type { ConfirmChannel } from 'amqplib';

export const EVENTS_EXCHANGE = 'scout.events';
export const DEAD_LETTER_EXCHANGE = 'scout.events.dlx';
export const DEAD_LETTER_QUEUE = 'scout.events.dead';

/** Очереди получателей и их привязки. Источник: таблица "Слушатели" в документе. */
export const CONSUMER_BINDINGS = [
  {
    queue: 'notification.events',
    keys: [
      'user.created',
      'user.watchlist_changed',
      'user.settings_changed',
      'player.status_changed',
      'player.price_changed',
      'gameweek.deadline_approaching',
      'report.ready',
    ],
  },
  {
    queue: 'analytics.events',
    keys: [
      'snapshot.ready',
      'player.status_changed',
      'player.price_changed',
      'gameweek.deadline_approaching',
      'gameweek.finished',
    ],
  },
] as const;

/** Идемпотентно: можно вызывать при каждом (пере)подключении любым сервисом. */
export async function assertTopology(ch: ConfirmChannel): Promise<void> {
  await ch.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
  await ch.assertExchange(DEAD_LETTER_EXCHANGE, 'fanout', { durable: true });
  await ch.assertQueue(DEAD_LETTER_QUEUE, { durable: true });
  await ch.bindQueue(DEAD_LETTER_QUEUE, DEAD_LETTER_EXCHANGE, '');

  for (const { queue, keys } of CONSUMER_BINDINGS) {
    await ch.assertQueue(queue, {
      durable: true,
      arguments: { 'x-dead-letter-exchange': DEAD_LETTER_EXCHANGE },
    });
    for (const key of keys) {
      await ch.bindQueue(queue, EVENTS_EXCHANGE, key);
    }
  }
}
