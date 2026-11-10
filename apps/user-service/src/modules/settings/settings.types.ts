import { NotificationSettings } from '../../database/entities/notification-settings.entity';

export type SettingsData = Pick<
  NotificationSettings,
  | 'deadline_reminder_hours'
  | 'notify_report'
  | 'notify_injuries'
  | 'notify_price'
  | 'quiet_from'
  | 'quiet_to'
>;

export function toSettingsData(s: NotificationSettings): SettingsData {
  return {
    deadline_reminder_hours: s.deadline_reminder_hours,
    notify_report: s.notify_report,
    notify_injuries: s.notify_injuries,
    notify_price: s.notify_price,
    quiet_from: s.quiet_from,
    quiet_to: s.quiet_to,
  };
}
