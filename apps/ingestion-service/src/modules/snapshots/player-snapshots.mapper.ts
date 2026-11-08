import { Player } from '../../database/entities/player.entity';
import { PlayerSnapshot } from '../../database/entities/player-snapshot.entity';

export type PlayerSnapshotSource = Pick<
  Player,
  'id' | 'now_cost' | 'status' | 'chance_of_playing_next_round' | 'selected_by_percent'
>;
export type PlayerSnapshotRow = Omit<PlayerSnapshot, 'id'>;

export function mapPlayerSnapshot(
  playerSnapshot: PlayerSnapshotSource,
  now: Date,
): PlayerSnapshotRow {
  return {
    player_id: playerSnapshot.id,
    captured_at: now,
    now_cost: playerSnapshot.now_cost,
    status: playerSnapshot.status,
    chance_of_playing_next_round: playerSnapshot.chance_of_playing_next_round ?? null,
    selected_by_percent: playerSnapshot.selected_by_percent,
  };
}
