import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, MoreThan, Repository } from 'typeorm';
import { Gameweek } from '../../database/entities/gameweek.entity';
import { upsertInChunks } from '../../database/upsert.util';

@Injectable()
export class GameweeksRepository {
  constructor(@InjectRepository(Gameweek) private readonly repo: Repository<Gameweek>) {}

  /** Передайте manager, чтобы выполнить upsert внутри внешней транзакции. */
  upsertMany(rows: Gameweek[], manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(Gameweek) : this.repo;
    return upsertInChunks(repo, rows, ['id']);
  }

  /** Номер текущего тура, а если его нет, следующего. В межсезонье может быть null. */
  async findCurrentOrNextId(manager?: EntityManager): Promise<number | null> {
    const repo = manager ? manager.getRepository(Gameweek) : this.repo;
    const row = await repo.findOne({
      where: [{ is_current: true }, { is_next: true }],
      order: { is_current: 'DESC', id: 'ASC' },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  /** Тур с наименьшим deadline_time_epoch больше заданного момента (epoch в секундах). */
  findNextDeadline(nowEpochSec: number): Promise<Gameweek | null> {
    return this.repo.findOne({
      where: { deadline_time_epoch: MoreThan(nowEpochSec) },
      order: { deadline_time_epoch: 'ASC' },
    });
  }

  /** id тура -> был ли он завершён (finished && data_checked) до текущего upsert. */
  async findCompletionStates(manager?: EntityManager): Promise<Map<number, boolean>> {
    const repo = manager ? manager.getRepository(Gameweek) : this.repo;
    const rows = await repo.find({ select: { id: true, finished: true, data_checked: true } });
    return new Map(rows.map((row) => [row.id, row.finished && row.data_checked]));
  }
}
