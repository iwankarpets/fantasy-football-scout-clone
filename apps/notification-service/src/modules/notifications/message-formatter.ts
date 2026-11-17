// 1. Описываем строгие контракты событий
export interface PlayerStatusPayload {
  player_id: number;
  changed?: string[];
  new_status: string;
  chance_next_round: number | null;
  news: string | null;
}

export interface PlayerPricePayload {
  player_id: number;
  old_price: number;
  new_price: number;
}

export interface DeadlinePayload {
  gameweek_number: number;
  hours_left: number;
  deadline_at: string;
}

// 2. Создаем объединение, где type — это "разметка"
export type NotificationEvent =
  | { type: 'player_status'; p: PlayerStatusPayload }
  | { type: 'player_price'; p: PlayerPricePayload }
  | { type: 'deadline'; p: DeadlinePayload };

const STATUS: Record<string, string> = {
  a: 'available',
  d: 'doubtful',
  i: 'injured',
  s: 'suspended',
  u: 'unavailable',
};

const KNOWN_TYPES = ['player_status', 'player_price', 'deadline'] as const;

export function toNotificationEvent(
  type: string,
  payload: Record<string, unknown>,
): NotificationEvent | null {
  if ((KNOWN_TYPES as readonly string[]).includes(type)) {
    return { type, p: payload } as unknown as NotificationEvent;
  }
  return null;
}

// 3. Функция принимает единый объект события
export function formatNotification(event: NotificationEvent, timezone = 'UTC'): string {
  if (event.type === 'deadline') {
    return (
      `⏰ ${event.p.hours_left}h left until Gameweek ${event.p.gameweek_number} deadline.\n` +
      `Deadline: ${formatDeadline(event.p.deadline_at, timezone)}`
    );
  }

  if (event.type === 'player_status') {
    const { p } = event;
    const changed = p.changed ?? ['status'];
    const status = STATUS[p.new_status] ?? p.new_status;
    const chance =
      p.chance_next_round === null ? '' : `\nChance of playing next round: ${p.chance_next_round}%`;
    const news = p.news ? `\n${p.news}` : '';
    const head = changed.includes('status')
      ? `⚠️ Player #${p.player_id}: status changed to "${status}".`
      : `📰 Player #${p.player_id}: new update.`;

    return `${head}${chance}${news}`;
  }

  if (event.type === 'player_price') {
    const { p } = event;
    const oldP = (p.old_price / 10).toFixed(1);
    const newP = (p.new_price / 10).toFixed(1);
    const arrow = p.new_price > p.old_price ? '📈' : '📉';

    return `${arrow} Player #${p.player_id}: price ${oldP} → ${newP}`;
  }

  return 'New notification';
}

function formatDeadline(iso: string, timezone: string): string {
  const date = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  };
  try {
    // Изменено на en-GB для британского формата
    return `${new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: timezone }).format(date)} (${timezone})`;
  } catch {
    return `${new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(date)} (UTC)`;
  }
}
