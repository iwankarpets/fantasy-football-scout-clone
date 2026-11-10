import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import { z } from 'zod';
import { AnyEventDefinition, createEvent } from '@app/contracts';

export interface OutboxAddOptions {
  correlationId?: string;
  dedupKey?: string;
}

@Injectable()
export class OutboxService {
  /** Пишет событие в outbox в транзакции manager. false: событие с таким dedup_key уже есть. */
  async add<D extends AnyEventDefinition>(
    def: D,
    data: z.input<D['dataSchema']>,
    manager: EntityManager,
    opts: OutboxAddOptions = {},
  ): Promise<boolean> {
    const id = randomUUID();
    const event = createEvent(def, data, {
      source: 'user-service',
      eventId: id,
      correlationId: opts.correlationId,
    });

    const rows: { n: number }[] = await manager.query(
      `WITH ins AS (
         INSERT INTO outbox_events (id, type, payload, created_at, dedup_key)
         VALUES ($1, $2, $3::jsonb, clock_timestamp(), $4)
         ON CONFLICT (dedup_key) DO NOTHING
         RETURNING id
       )
       SELECT count(*)::int AS n FROM ins`,
      [id, def.type, JSON.stringify(event), opts.dedupKey ?? null],
    );
    return rows[0].n > 0;
  }
}
