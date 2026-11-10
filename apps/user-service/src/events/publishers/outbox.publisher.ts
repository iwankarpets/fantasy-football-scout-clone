import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RabbitService } from '@app/messaging';

const POLL_INTERVAL_MS = 1000;
const BATCH_SIZE = 100;

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly rabbit: RabbitService,
  ) {}

  onModuleInit(): void {
    this.schedule(POLL_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  /** setTimeout instead of setInterval: the next tick starts only after the previous one finishes. */
  private schedule(delay: number): void {
    if (this.stopped) {
      return;
    }
    this.timer = setTimeout(() => {
      void this.run();
    }, delay);
  }

  private async run(): Promise<void> {
    let next = POLL_INTERVAL_MS;
    try {
      const sent = await this.tick();
      if (sent === BATCH_SIZE) {
        // queue is not empty, do not wait
        next = 0;
      }
    } catch (e) {
      this.logger.error(`Error publishing outbox events: ${(e as Error).message}`);
    }
    this.schedule(next);
  }

  /** Returns the number of sent events. */
  private async tick(): Promise<number> {
    return this.dataSource.transaction(async (m) => {
      // SKIP LOCKED: multiple service instances will not grab the same rows
      const rows: {
        id: string;
        payload: { type: string; event_id: string; occurred_at: string };
      }[] = await m.query(
        `SELECT id, payload
             FROM outbox_events
            WHERE published_at IS NULL
            ORDER BY created_at, id
            LIMIT $1
            FOR UPDATE SKIP LOCKED`,
        [BATCH_SIZE],
      );
      if (rows.length === 0) {
        return 0;
      }

      const sentIds: string[] = [];
      for (const row of rows) {
        try {
          await this.rabbit.publish(row.payload);
          sentIds.push(row.id);
        } catch (e) {
          // Stop on the first error: order is preserved, the rest will be sent on the next tick
          this.logger.warn(`Failed to send ${row.id}: ${(e as Error).message}`);
          break;
        }
      }

      if (sentIds.length > 0) {
        await m.query(`UPDATE outbox_events SET published_at = now() WHERE id = ANY($1::uuid[])`, [
          sentIds,
        ]);
      }
      return sentIds.length;
    });
  }
}
