import type { ConfirmChannel } from 'amqplib';

/** Основной exchange: routing key = type события (например, player.price_changed). */
export const EVENTS_EXCHANGE = 'scout.events';
/** Сюда попадают отклонённые сообщения (неверный формат, ошибка обработки). */
export const DEAD_LETTER_EXCHANGE = 'scout.events.dlx';
export const DEAD_LETTER_QUEUE = 'scout.events.dead';

/** Идемпотентно: можно вызывать при каждом (пере)подключении. */
export async function assertTopology(ch: ConfirmChannel): Promise<void> {
  await ch.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
  await ch.assertExchange(DEAD_LETTER_EXCHANGE, 'fanout', { durable: true });
  await ch.assertQueue(DEAD_LETTER_QUEUE, { durable: true });
  await ch.bindQueue(DEAD_LETTER_QUEUE, DEAD_LETTER_EXCHANGE, '');
}
