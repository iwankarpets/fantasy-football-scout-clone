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

// 2. Создаем объединение, где type — это "разметка"
export type NotificationEvent =
  | { type: 'player_status'; p: PlayerStatusPayload }
  | { type: 'player_price'; p: PlayerPricePayload };

// 3. Функция принимает единый объект события
export function formatNotification(event: NotificationEvent): string {
  if (event.type === 'player_status') {
    // Здесь TypeScript УЖЕ знает, что event.p это PlayerStatusPayload.
    // Никаких unknown и as!
    const { p } = event;
    const changed = p.changed ?? ['status'];
    const status = STATUS[p.new_status] ?? p.new_status;
    const chance =
      p.chance_next_round === null
        ? ''
        : `\nШанс сыграть в следующем туре: ${p.chance_next_round}%`;
    const news = p.news ? `\n${p.news}` : '';
    const head = changed.includes('status')
      ? `⚠️ Игрок #${p.player_id}: статус изменился на «${status}».`
      : `📰 Игрок #${p.player_id}: новая новость.`;

    return `${head}${chance}${news}`;
  }

  if (event.type === 'player_price') {
    const { p } = event;
    // TypeScript знает, что old_price — это число
    const oldP = (p.old_price / 10).toFixed(1);
    const newP = (p.new_price / 10).toFixed(1);
    const arrow = p.new_price > p.old_price ? '📈' : '📉';

    return `${arrow} Игрок #${p.player_id}: цена ${oldP} → ${newP}`;
  }

  return 'Новое уведомление';
}
