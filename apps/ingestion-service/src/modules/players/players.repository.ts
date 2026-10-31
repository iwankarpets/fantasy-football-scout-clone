import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Player } from '../../database/entities/player.entity';
import { upsertInChunks } from '../../database/upsert.util';
import { PlayerBaseline } from '../changes/player-changes.detector';

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
    const rows = await repo.find({ select: { id: true, now_cost: true, status: true, news: true } });
    return new Map(rows.map((r) => [r.id, r]));
  }
}
