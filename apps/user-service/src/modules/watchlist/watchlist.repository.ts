import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Watchlist } from '../../database/entities/watchlist.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class WatchlistRepository {
  constructor(@InjectRepository(Watchlist) private readonly repo: Repository<Watchlist>) {}

  list(userId: string): Promise<Watchlist[]> {
    return this.repo.find({
      where: { user_id: userId },
      order: { added_at: 'ASC' },
    });
  }

  /** true, если строка добавлена; false, если игрок уже был в списке. */
  async add(userId: string, playerId: number, manager: EntityManager): Promise<boolean> {
    const res = await manager
      .createQueryBuilder()
      .insert()
      .into(Watchlist)
      .values({ user_id: userId, player_id: playerId })
      .orIgnore() // ON CONFLICT DO NOTHING
      .returning('player_id')
      .execute();
    return Array.isArray(res.raw) && res.raw.length > 0;
  }

  /** true, если строка удалена; false, если игрока в списке не было. */
  async remove(userId: string, playerId: number, manager: EntityManager): Promise<boolean> {
    const res = await manager
      .getRepository(Watchlist)
      .delete({ user_id: userId, player_id: playerId });
    return (res.affected ?? 0) > 0;
  }

  userExists(userId: string, manager?: EntityManager): Promise<boolean> {
    return (manager ?? this.repo.manager).exists(User, { where: { id: userId } });
  }
}
