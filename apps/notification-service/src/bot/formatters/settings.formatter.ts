import { InlineKeyboard } from 'grammy';
import type { SettingsView } from '../../clients/user-api/user-api.client';

/** Напоминания, которые публикует ingestion (за 24 и за 3 часа до дедлайна). */
export const REMINDER_OPTIONS = [24, 3] as const;

/** Готовые варианты тихих часов. Ключ попадает в callback data, поэтому короткий. */
export const QUIET_PRESETS: Record<
  string,
  { from: string | null; to: string | null; label: string }
> = {
  off: { from: null, to: null, label: 'Off' },
  n1: { from: '22:00', to: '08:00', label: '22:00–08:00' },
  n2: { from: '23:00', to: '07:00', label: '23:00–07:00' },
  n3: { from: '00:00', to: '08:00', label: '00:00–08:00' },
};

export const TOGGLE_FIELDS = {
  report: 'notify_report',
  injuries: 'notify_injuries',
  price: 'notify_price',
} as const;

const mark = (on: boolean) => (on ? '✅' : '❌');

export function renderSettings(s: SettingsView): { text: string; keyboard: InlineKeyboard } {
  const reminders = REMINDER_OPTIONS.filter((h) => s.deadline_reminder_hours.includes(h));
  const quiet =
    s.quiet_from && s.quiet_to ? `${s.quiet_from}–${s.quiet_to} (${s.timezone})` : 'off';

  const text = [
    'Notification settings',
    '',
    `Gameweek report: ${mark(s.notify_report)}`,
    `Injury and news alerts: ${mark(s.notify_injuries)}`,
    `Price changes: ${mark(s.notify_price)}`,
    `Deadline reminders: ${reminders.length ? reminders.map((h) => `${h}h`).join(', ') : 'off'}`,
    `Quiet hours: ${quiet}`,
  ].join('\n');

  const keyboard = new InlineKeyboard()
    .text(`${mark(s.notify_report)} Gameweek report`, 's:t:report')
    .row()
    .text(`${mark(s.notify_injuries)} Injuries and news`, 's:t:injuries')
    .row()
    .text(`${mark(s.notify_price)} Price changes`, 's:t:price')
    .row();

  for (const h of REMINDER_OPTIONS) {
    keyboard.text(
      `${mark(s.deadline_reminder_hours.includes(h))} ${h}h before deadline`,
      `s:r:${h}`,
    );
  }
  keyboard.row();

  const entries = Object.entries(QUIET_PRESETS);
  entries.forEach(([key, p], i) => {
    const active = p.from === s.quiet_from && p.to === s.quiet_to;
    keyboard.text(`${active ? '🔘' : '⚪'} ${p.label}`, `s:q:${key}`);
    if (i % 2 === 1) {
      keyboard.row();
    }
  });

  return { text, keyboard };
}
