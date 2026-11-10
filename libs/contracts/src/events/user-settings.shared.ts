import { z } from 'zod';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** Настройки уведомлений: общая часть user.created и user.settings_changed. */
export const notificationSettingsSchema = z.object({
  /** За сколько часов до дедлайна напоминать, например [24, 3]. */
  deadline_reminder_hours: z.array(z.number().int().min(1).max(168)).max(5),
  notify_report: z.boolean(),
  notify_injuries: z.boolean(),
  notify_price: z.boolean(),
  /** Тихие часы 'HH:MM' в часовом поясе пользователя; оба null или оба заданы. */
  quiet_from: hhmm.nullable(),
  quiet_to: hhmm.nullable(),
});
