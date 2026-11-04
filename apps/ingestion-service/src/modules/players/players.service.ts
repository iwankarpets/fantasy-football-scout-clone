import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApiPlayer } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { PlayersRepository } from './players.repository';
import { mapPlayer } from './players.mapper';
import { PlayerChangesService } from '../changes/player-changes.service';
import { detectPlayerChanges, PlayerChangeRow } from '../changes/player-changes.detector';
import { PlayerSnapshotSource } from '../snapshots/player-snapshots.mapper';
import { PlayerStatus, PlayerStatusChangedV1 } from '@app/contracts/events/player-status-changed.v1';
import { PlayerPriceChangedV1 } from '@app/contracts/events/player-price-changed.v1';
import { OutboxService } from '../../events/outbox/outbox.service';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    private readonly playerRepository: PlayersRepository,
    private readonly changesRepository: PlayerChangesService,
    private readonly outbox: OutboxService,
  ) {}

   async upsertFromApi(items: ApiPlayer[], manager: EntityManager, correlationId?: string): Promise<number> {
    const now = new Date();
    const rows = items.map((item) => mapPlayer(item, now));
    const rowsById = new Map(rows.map((r) => [r.id, r]));

    // Старые значения читаем ДО upsert
    const baselines = await this.playerRepository.findBaselines(manager);
    const changes = rows.flatMap((row) => detectPlayerChanges(baselines.get(row.id), row, now));

    const count = await this.playerRepository.upsertMany(rows, manager);

    if (changes.length > 0) {
      await this.changesRepository.record(changes, manager);

      // Одна запись в player_changes на изменение, но одно событие на игрока и тип
      const byPlayer = new Map<number, PlayerChangeRow[]>();
      for (const c of changes) {
        const list = byPlayer.get(c.player_id) ?? [];
        list.push(c);
        byPlayer.set(c.player_id, list);
      }

      for (const [playerId, list] of byPlayer) {
        const old = baselines.get(playerId)!;
        const next = rowsById.get(playerId)!;

        if (list.some((c) => c.type === 'price')) {
          await this.outbox.add(
            PlayerPriceChangedV1,
            { player_id: playerId, old_price: old.now_cost, new_price: next.now_cost },
            manager,
            { correlationId },
          );
        }

        const changed = list.filter((c) => c.type !== 'price').map((c) => c.type as 'status' | 'news');
        if (changed.length > 0) {
          await this.outbox.add(
            PlayerStatusChangedV1,
            {
              player_id: playerId,
              old_status: old.status as PlayerStatus,
              new_status: next.status as PlayerStatus,
              chance_next_round: next.chance_of_playing_next_round ?? null,
              news: next.news ?? '',
              news_added_at: next.news_added ? next.news_added.toISOString() : null,
              changed,
            },
            manager,
            { correlationId },
          );
        }
      }
      this.logger.log(`Изменений у игроков: ${changes.length}, игроков затронуто: ${byPlayer.size}`);
    }
    return count;
  }

  getAllIds(): Promise<number[]> {
    return this.playerRepository.findAllIds();
  }

 getForSnapshot(): Promise<PlayerSnapshotSource[]> {
  return this.playerRepository.findForSnapshot();
}

  getIdsWithNewMatches(days = 3): Promise<number[]> {
    return this.playerRepository.findIdsWithNewMatches(days);
  }
}
