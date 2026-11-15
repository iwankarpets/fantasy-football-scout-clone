import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export interface RecipientData {
  user_id: string;
  telegram_chat_id: number;
  timezone: string;
  language: string;
  deadline_reminder_hours: number[];
  notify_report: boolean;
  notify_injuries: boolean;
  notify_price: boolean;
  quiet_from: string | null;
  quiet_to: string | null;
}

@Injectable()
export class RecipientsRepository {
  async upsert(d: RecipientData, m: EntityManager): Promise<void> {
    await m.query(
      `INSERT INTO recipients
         (user_id, telegram_chat_id, timezone, language, deadline_reminder_hours,
          notify_report, notify_injuries, notify_price, quiet_from, quiet_to)
       VALUES ($1, $2, $3, $4, $5::int[], $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
         timezone = EXCLUDED.timezone,
         language = EXCLUDED.language,
         deadline_reminder_hours = EXCLUDED.deadline_reminder_hours,
         notify_report = EXCLUDED.notify_report,
         notify_injuries = EXCLUDED.notify_injuries,
         notify_price = EXCLUDED.notify_price,
         quiet_from = EXCLUDED.quiet_from,
         quiet_to = EXCLUDED.quiet_to,
         updated_at = now()`,
      [
        d.user_id,
        d.telegram_chat_id,
        d.timezone,
        d.language,
        d.deadline_reminder_hours,
        d.notify_report,
        d.notify_injuries,
        d.notify_price,
        d.quiet_from,
        d.quiet_to,
      ],
    );
  }

  /** Возвращает число обновлённых строк (0: получателя ещё нет). */
  async updateSettings(
    d: Omit<RecipientData, 'telegram_chat_id'>,
    m: EntityManager,
  ): Promise<number> {
    const res: [unknown[], number] = await m.query(
      `UPDATE recipients SET
         timezone = $2, language = $3, deadline_reminder_hours = $4::int[],
         notify_report = $5, notify_injuries = $6, notify_price = $7,
         quiet_from = $8, quiet_to = $9, updated_at = now()
       WHERE user_id = $1`,
      [
        d.user_id,
        d.timezone,
        d.language,
        d.deadline_reminder_hours,
        d.notify_report,
        d.notify_injuries,
        d.notify_price,
        d.quiet_from,
        d.quiet_to,
      ],
    );
    return res[1];
  }
}
