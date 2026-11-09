import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { GameweekFinishedV1 } from '@app/contracts';
import { ApiGameweek } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { Gameweek } from '../../database/entities/gameweek.entity';
import { OutboxService } from '../../events/outbox/outbox.service';
import { GameweeksRepository } from './gameweeks.repository';
import { mapGameweek } from './gameweeks.mapper';

@Injectable()
export class GameweeksService {
  constructor(
    private readonly repository: GameweeksRepository,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Upsert по id. Если тур перешёл в состояние finished && data_checked,
   * пишет gameweek.finished в outbox в той же транзакции.
   * manager обязателен, как и в PlayersService.
   */
  async upsertFromApi(
    items: ApiGameweek[],
    manager: EntityManager,
    correlationId?: string,
  ): Promise<number> {
    const now = new Date();
    const rows = items.map((item) => mapGameweek(item, now));

    // Старое состояние читаем ДО upsert
    const wasCompleted = await this.repository.findCompletionStates(manager);
    const count = await this.repository.upsertMany(rows, manager);

    for (const row of rows) {
      const before = wasCompleted.get(row.id);
      // undefined: тура ещё не было (первая загрузка), события нет. true: уже было завершено.
      if (before === undefined || before) {
        continue;
      }
      if (row.finished && row.data_checked) {
        await this.outbox.add(GameweekFinishedV1, { gameweek_number: row.id }, manager, {
          correlationId,
          dedupKey: `gameweek.finished:${row.id}`,
        });
      }
    }
    return count;
  }

  currentOrNextNumber(manager?: EntityManager): Promise<number | null> {
    return this.repository.findCurrentOrNextId(manager);
  }

  nextDeadline(now = new Date()): Promise<Gameweek | null> {
    return this.repository.findNextDeadline(Math.floor(now.getTime() / 1000));
  }
}
