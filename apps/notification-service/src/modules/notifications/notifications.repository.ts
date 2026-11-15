import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class NotificationsRepository {
  /**
   * Создаёт уведомление каждому активному подписчику игрока.
   * dedup_key включает event_id: одно событие даёт одно уведомление на пользователя.
   * (Ключ по значению цены не подходит: цена 6.0 → 6.1 → 6.0 дала бы пропуск второго «6.0».)
   */
  async createForWatchers(
    p: {
      playerId: number;
      type: 'player_status' | 'player_price';
      settingColumn: 'notify_injuries' | 'notify_price';
      eventId: string;
      payload: Record<string, unknown>;
    },
    m: EntityManager,
  ): Promise<number> {
    const rows: unknown[] = await m.query(
      `INSERT INTO notifications (user_id, type, dedup_key, payload)
   SELECT r.user_id, $2::varchar,
          r.user_id::text || ':' || $2::text || ':' || $3::text,
          $4::jsonb
     FROM watch_refs w
     JOIN recipients r ON r.user_id = w.user_id
    WHERE w.player_id = $1
      AND r.is_active = true
      AND r.${p.settingColumn} = true
   ON CONFLICT (dedup_key) DO NOTHING
   RETURNING id`,
      [p.playerId, p.type, p.eventId, JSON.stringify(p.payload)],
    );
    return rows.length;
  }
}
