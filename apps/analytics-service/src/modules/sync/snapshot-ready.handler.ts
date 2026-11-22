import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { scopeFromUpdated, SyncService } from './sync.service';

/** Минимальный вид data события snapshot.ready (см. SnapshotReadyV1 в libs/contracts). */
export interface SnapshotReadyData {
  gameweek_number: number | null;
  updated: readonly string[];
  sync_run_id: number;
}

/**
 * Бизнес-логика обработки snapshot.ready. Подключается в консьюмер так же,
 * как обработчики в notification-service: консьюмер валидирует конверт,
 * достаёт event_id и data и вызывает handle().
 *
 * event_id записывается после успешной синхронизации. Синхронизация
 * идемпотентна, поэтому при падении между шагами повтор события безопасен.
 */
@Injectable()
export class SnapshotReadyHandler {
  constructor(
    private readonly ds: DataSource,
    private readonly sync: SyncService,
  ) {}

  async handle(eventId: string, data: SnapshotReadyData): Promise<void> {
    const seen = await this.ds.query(`SELECT 1 FROM processed_events WHERE event_id = $1`, [
      eventId,
    ]);
    if (seen.length > 0) {
      return;
    }

    const scope = scopeFromUpdated(data.updated);
    if (scope.reference || scope.history) {
      await this.sync.run(scope);
      // TODO: после успешной синхронизации запускать пересчёт метрик.
    }

    await this.ds.query(
      `INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [eventId],
    );
  }
}
