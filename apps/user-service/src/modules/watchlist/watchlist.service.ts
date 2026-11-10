import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import { UserWatchlistChangedV1 } from '@app/contracts';
import { OutboxService } from '../../events/outbox/outbox.service';
import { WatchlistRepository } from './watchlist.repository';

@Injectable()
export class WatchlistService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: WatchlistRepository,
    private readonly outbox: OutboxService,
  ) {}

  async list(userId: string) {
    await this.assertUser(userId);
    const rows = await this.repository.list(userId);
    return rows.map((r) => ({ player_id: r.player_id, added_at: r.added_at }));
  }

  /** changed: false, если игрок уже был в списке (событие в этом случае не создаётся). */
  add(userId: string, playerId: number): Promise<{ changed: boolean }> {
    return this.dataSource.transaction(async (manager) => {
      await this.assertUser(userId, manager);
      const changed = await this.repository.add(userId, playerId, manager);
      return this.emit(changed, 'added', userId, playerId, manager);
    });
  }

  remove(userId: string, playerId: number): Promise<{ changed: boolean }> {
    return this.dataSource.transaction(async (manager) => {
      await this.assertUser(userId, manager);
      const changed = await this.repository.remove(userId, playerId, manager);
      return this.emit(changed, 'removed', userId, playerId, manager);
    });
  }

  private async emit(
    changed: boolean,
    action: 'added' | 'removed',
    userId: string,
    playerId: number,
    manager: EntityManager,
  ): Promise<{ changed: boolean }> {
    if (changed) {
      await this.outbox.add(
        UserWatchlistChangedV1,
        { user_id: userId, player_id: playerId, action },
        manager,
        { correlationId: randomUUID() },
      );
    }
    return { changed };
  }

  private async assertUser(userId: string, manager?: EntityManager): Promise<void> {
    if (!(await this.repository.userExists(userId, manager))) {
      throw new NotFoundException('User not found');
    }
  }
}
