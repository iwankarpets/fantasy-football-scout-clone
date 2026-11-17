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
  | { type: 'player_status'; payload: PlayerStatusPayload }
  | { type: 'player_price'; payload: PlayerPricePayload }
  | { type: 'deadline'; payload: DeadlinePayload };

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
    return { type, payload } as unknown as NotificationEvent;
  }
  return null;
}

// 3. Функция принимает единый объект события
export function formatNotification(event: NotificationEvent, timezone = 'UTC'): string {
  if (event.type === 'deadline') {
    return (
      `⏰ ${event.payload.hours_left}h left until Gameweek ${event.payload.gameweek_number} deadline.\n` +
      `Deadline: ${formatDeadline(event.payload.deadline_at, timezone)}`
    );
  }

  if (event.type === 'player_status') {
    const { payload } = event;
    const changed = payload.changed ?? ['status'];
    const status = STATUS[payload.new_status] ?? payload.new_status;
    const chance =
      payload.chance_next_round === null
        ? ''
        : `\nChance of playing next round: ${payload.chance_next_round}%`;
    const news = payload.news ? `\n${payload.news}` : '';
    const head = changed.includes('status')
      ? `⚠️ Player #${payload.player_id}: status changed to "${status}".`
      : `📰 Player #${payload.player_id}: new update.`;

    return `${head}${chance}${news}`;
  }

  if (event.type === 'player_price') {
    const { payload } = event;
    const oldP = (payload.old_price / 10).toFixed(1);
    const newP = (payload.new_price / 10).toFixed(1);
    const arrow = payload.new_price > payload.old_price ? '📈' : '📉';

    return `${arrow} Player #${payload.player_id}: price ${oldP} → ${newP}`;
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
