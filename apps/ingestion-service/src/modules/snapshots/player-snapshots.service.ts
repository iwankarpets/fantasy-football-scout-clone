import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PlayerSnapshotsRepository } from './player-snapshots.repository';
import { mapPlayerSnapshot, PlayerSnapshotSource } from './player-snapshots.mapper';

/** Границы суток по UTC: [00:00, следующие 00:00). */
function dayBounds(day: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

@Injectable()
export class PlayerSnapshotsService {
  constructor(private readonly repository: PlayerSnapshotsRepository) {}

  hasForDay(day: Date): Promise<boolean> {
    const { start, end } = dayBounds(day);
    return this.repository.existsForDay(start, end);
  }

  deleteForDay(day: Date, manager?: EntityManager): Promise<void> {
    const { start, end } = dayBounds(day);
    return this.repository.deleteForDay(start, end, manager);
  }

  /** Копирует ключевые поля игроков в снимок. Возвращает число строк. */
  createFromPlayers(
    players: PlayerSnapshotSource[],
    now: Date,
    manager?: EntityManager,
  ): Promise<number> {
    return this.repository.insertMany(
      players.map((p) => mapPlayerSnapshot(p, now)),
      manager,
    );
  }
}
