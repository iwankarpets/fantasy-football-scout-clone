import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Player } from '../../database/entities/player.entity';
import { upsertInChunks } from '../../database/upsert.util';
import { PlayerBaseline } from '../changes/player-changes.detector';
import { PlayerSnapshotSource } from '../snapshots/player-snapshots.mapper';
import { PlayerSearchResult } from './player.interfaces';

@Injectable()
export class PlayersRepository {
  constructor(@InjectRepository(Player) private readonly repo: Repository<Player>) {}

  /** Передайте manager, чтобы выполнить upsert внутри внешней транзакции. */
  upsertMany(rows: Player[], manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(Player) : this.repo;
    return upsertInChunks(repo, rows, ['id']);
  }

  async findAllIds(): Promise<number[]> {
    const rows = await this.repo.find({ select: { id: true }, order: { id: 'ASC' } });
    return rows.map((r) => r.id);
  }

  async findBaselines(manager?: EntityManager): Promise<Map<number, PlayerBaseline>> {
    const repo = manager ? manager.getRepository(Player) : this.repo;
    const rows = await repo.find({
      select: { id: true, now_cost: true, status: true, news: true },
    });
    return new Map(rows.map((r) => [r.id, r]));
  }

  async findForSnapshot(): Promise<PlayerSnapshotSource[]> {
    return this.repo.find({
      select: {
        id: true,
        now_cost: true,
        status: true,
        chance_of_playing_next_round: true,
        selected_by_percent: true,
      },
      order: { id: 'ASC' },
    });
  }

  async findIdsWithNewMatches(days: number): Promise<number[]> {
    const rows: { id: number }[] = await this.repo.query(
      `SELECT DISTINCT p.id
       FROM players p
       JOIN fixtures f
         ON f.finished AND f.finished_provisional
        AND f.kickoff_time > now() - make_interval(days => $1::int)
        AND (f.team_h = p.team OR f.team_a = p.team)
       LEFT JOIN player_gameweek_stats s
         ON s.element = p.id AND s.fixture = f.id
      WHERE s.id IS NULL
      ORDER BY p.id`,
      [days],
    );
    return rows.map((r) => r.id);
  }

  async search(query: string, limit: number): Promise<PlayerSearchResult[]> {
    // Спецсимволы LIKE в тексте пользователя ищем как обычные символы
    const escaped = query.replace(/[\\%_]/g, '\\$&');

    return this.repo.query(
      `SELECT p.id,
              p.web_name,
              t.short_name AS team,
              et.singular_name_short AS position,
              p.status,
              p.now_cost
         FROM players p
         JOIN teams t ON t.id = p.team
         JOIN element_types et ON et.id = p.element_type
        WHERE p.web_name ILIKE $1
           OR (p.first_name || ' ' || p.second_name) ILIKE $1
        ORDER BY (lower(p.web_name) = lower($2)) DESC,
                 (p.web_name ILIKE $3) DESC,
                 p.total_points DESC,
                 p.id
        LIMIT $4`,
      [`%${escaped}%`, query, `${escaped}%`, limit],
    );
  }
}
