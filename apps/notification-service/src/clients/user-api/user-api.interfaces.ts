export interface StartUserInput {
  telegram_id: number;
  username: string | null;
  language: string | null;
}

export interface StartUserResult {
  user: {
    id: string;
    telegram_id: number;
    username: string | null;
    language: string;
    timezone: string;
  };
  created: boolean;
}

export interface SettingsView {
  deadline_reminder_hours: number[];
  notify_report: boolean;
  notify_injuries: boolean;
  notify_price: boolean;
  quiet_from: string | null;
  quiet_to: string | null;
  timezone: string;
  language: string;
}
