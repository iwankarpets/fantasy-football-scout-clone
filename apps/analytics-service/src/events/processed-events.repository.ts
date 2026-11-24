import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class ProcessedEventsRepository {
  /** true: событие новое. false: уже обрабатывалось. */
  async markProcessed(eventId: string, m: EntityManager): Promise<boolean> {
    const rows: unknown[] = await m.query(
      `INSERT INTO processed_events (event_id) VALUES ($1)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      [eventId],
    );
    return rows.length > 0;
  }
}
