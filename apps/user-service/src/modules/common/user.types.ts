export interface UserRow {
  id: string;
  telegram_id: number;
  username: string | null;
  language: string;
  timezone: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: Date;
  last_seen_at: Date;
}

export interface SettingsRow {
  deadline_reminder_hours: number[];
  notify_report: boolean;
  notify_injuries: boolean;
  notify_price: boolean;
  quiet_from: string | null;
  quiet_to: string | null;
}
