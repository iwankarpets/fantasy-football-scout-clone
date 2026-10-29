import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Player } from '../../database/entities/player.entity';
import { upsertInChunks } from '../../database/upsert.util';

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
}
