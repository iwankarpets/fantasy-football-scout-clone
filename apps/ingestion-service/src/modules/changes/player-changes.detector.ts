import { Player } from '../../database/entities/player.entity';
import { PlayerChange } from '../../database/entities/player-change.entity';

export type PlayerBaseline = Pick<Player, 'id' | 'now_cost' | 'status' | 'news'>;
export type PlayerChangeRow = Omit<PlayerChange, 'id'>;

/** old === undefined: игрока ещё не было в базе, это вставка, а не изменение. */
export function detectPlayerChanges(
  old: PlayerBaseline | undefined,
  next: PlayerBaseline,
  now: Date,
): PlayerChangeRow[] {
  if (!old) return [];

  const rows: PlayerChangeRow[] = [];
  const push = (type: PlayerChangeRow['type'], from: string, to: string) =>
    rows.push({ player_id: next.id, type, old_value: from, new_value: to, detected_at: now });

  if (old.now_cost !== next.now_cost) push('price', String(old.now_cost), String(next.now_cost));
  if (old.status !== next.status) push('status', old.status, next.status);
  if (old.news !== next.news) push('news', old.news, next.news);

  return rows;
}