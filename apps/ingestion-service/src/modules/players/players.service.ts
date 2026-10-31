import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ApiPlayer } from '../../clients/fpl-api/schemas/bootstrap-static.schema';
import { PlayersRepository } from './players.repository';
import { mapPlayer } from './players.mapper';
import { PlayerChangesService } from '../changes/player-changes.service';
import { detectPlayerChanges } from '../changes/player-changes.detector';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    private readonly playerRepository: PlayersRepository,
    private readonly changesRepository: PlayerChangesService,
  ) {}

  /** Сравнивает со старыми строками, делает upsert по id и пишет player_changes. Возвращает число строк. */
  async upsertFromApi(items: ApiPlayer[], manager?: EntityManager): Promise<number> {
    const now = new Date();
    const rows = items.map((item) => mapPlayer(item, now));

    // Старые значения читаем ДО upsert
    const baselines = await this.playerRepository.findBaselines(manager);
    const changes = rows.flatMap((row) => detectPlayerChanges(baselines.get(row.id), row, now));

    const count = await this.playerRepository.upsertMany(rows, manager);
    if (changes.length > 0) {
      await this.changesRepository.record(changes, manager);
      this.logger.log(`Изменений у игроков: ${changes.length}`);
    }
    return count;
  }

  getAllIds(): Promise<number[]> {
    return this.playerRepository.findAllIds();
  }
}
