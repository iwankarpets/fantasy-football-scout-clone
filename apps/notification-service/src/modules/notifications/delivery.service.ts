import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { GrammyError } from 'grammy';
import { DataSource } from 'typeorm';
import { formatNotification } from './message-formatter';
import { TelegramSender } from './telegram-sender';

const INTERVAL_MS = 2000;
const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
const PAUSE_BETWEEN_SENDS_MS = 50; // Telegram ограничивает частоту отправки

interface Row {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  user_id: string;
  telegram_chat_id: number;
}

@Injectable()
export class DeliveryService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryService.name);
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly sender: TelegramSender,
  ) {}

  onApplicationBootstrap(): void {
    this.schedule(INTERVAL_MS);
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  private schedule(delay: number): void {
    if (this.stopped) {
      return;
    }
    this.timer = setTimeout(() => void this.run(), delay);
  }

  private async run(): Promise<void> {
    let next = INTERVAL_MS;
    try {
      const processed = await this.tick();
      if (processed === BATCH_SIZE) {
        next = 0;
      } // очередь не пуста
    } catch (e) {
      this.logger.error(`Delivery tick failed: ${(e as Error).message}`);
    }
    this.schedule(next);
  }

  private async tick(): Promise<number> {
    return this.dataSource.transaction(async (m) => {
      const rows: Row[] = await m.query(
        `SELECT n.id, n.type, n.payload, n.attempts, n.user_id, r.telegram_chat_id
           FROM notifications n
           JOIN recipients r ON r.user_id = n.user_id
          WHERE n.status = 'queued' AND n.scheduled_at <= now() AND r.is_active = true
          ORDER BY n.scheduled_at
          LIMIT $1
          FOR UPDATE OF n SKIP LOCKED`,
        [BATCH_SIZE],
      );

      for (const row of rows) {
        try {
          await this.sender.send(
            Number(row.telegram_chat_id),
            formatNotification(row.type, row.payload),
          );
          await m.query(
            `UPDATE notifications SET status = 'sent', sent_at = now(), attempts = attempts + 1 WHERE id = $1`,
            [row.id],
          );
        } catch (e) {
          await this.handleError(row, e as Error, m);
        }
        await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_SENDS_MS));
      }
      return rows.length;
    });
  }

  private async handleError(row: Row, e: Error, m: import('typeorm').EntityManager): Promise<void> {
    // 403: пользователь заблокировал бота. Больше ему не пишем.
    if (e instanceof GrammyError && e.error_code === 403) {
      this.logger.warn(`User ${row.user_id} blocked the bot, deactivating`);
      await m.query(
        `UPDATE recipients SET is_active = false, updated_at = now() WHERE user_id = $1`,
        [row.user_id],
      );
      await m.query(
        `UPDATE notifications SET status = 'failed', error = $2, attempts = attempts + 1 WHERE id = $1`,
        [row.id, 'bot blocked'],
      );
      return;
    }

    const attempts = row.attempts + 1;
    this.logger.warn(`Send ${row.id} failed (attempt ${attempts}): ${e.message}`);
    if (attempts >= MAX_ATTEMPTS) {
      await m.query(
        `UPDATE notifications SET status = 'failed', attempts = $2, error = $3 WHERE id = $1`,
        [row.id, attempts, e.message],
      );
    } else {
      // повтор позже, пауза растёт: 1, 2, 3... минуты
      await m.query(
        `UPDATE notifications SET attempts = $2, error = $3,
                scheduled_at = now() + make_interval(mins => $2) WHERE id = $1`,
        [row.id, attempts, e.message],
      );
    }
  }
}
