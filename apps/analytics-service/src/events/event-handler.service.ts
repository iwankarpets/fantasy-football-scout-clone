import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ParsedEvent } from '@app/messaging';
// TODO: поправь путь, если файл называется иначе
import { SnapshotReadyHandler } from '../modules/sync/snapshot-ready.handler';
import { ProcessedEventsRepository } from './processed-events.repository';
import { SNAPSHOT_READY, SnapshotReadyV1 } from '@app/contracts';

/**
 * Одна транзакция на событие: отметка в processed_events + действие.
 * Если действие бросит ошибку, откатится и отметка; RabbitService повторит
 * обработку (3 попытки), затем отправит сообщение в DLQ.
 */
@Injectable()
export class EventHandler {
  private readonly logger = new Logger(EventHandler.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly processed: ProcessedEventsRepository,
    private readonly snapshotReady: SnapshotReadyHandler,
  ) {}

  async handle(event: ParsedEvent): Promise<void> {
    // Очередь привязана и к player.*, и к gameweek.*, но реакции пока нет:
    // такие события подтверждаем, не засоряя processed_events
    if (event.type !== SNAPSHOT_READY) {
      this.logger.debug(`No handler for ${event.type}, ignored`);
      return;
    }

    await this.dataSource.transaction(async (m) => {
      const isNew = await this.processed.markProcessed(event.event_id, m);
      if (!isNew) {
        this.logger.warn(`Duplicate ${event.type} ${event.event_id}, skipped`);
        return;
      }
      // sync и пересчёт идут своими транзакциями и идемпотентны (upsert)
      await this.snapshotReady.apply(event.data);
    });
  }
}
