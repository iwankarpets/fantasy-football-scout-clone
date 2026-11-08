import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FplApiClient } from '../clients/fpl-api/fpl-api.client';
import { ElementTypesService } from '../modules/element-types/element-types.service';
import { GameweeksService } from '../modules/gameweeks/gameweeks.service';
import { PlayersService } from '../modules/players/players.service';
import { SyncRunsService } from '../modules/sync-runs/sync-runs.service';
import { TeamsService } from '../modules/teams/teams.service';
import { OutboxService } from '../events/outbox/outbox.service';
import { randomUUID } from 'crypto';
import { SnapshotReadyV1 } from '@app/contracts/events/snapshot-ready.v1';

const ENDPOINT = 'bootstrap-static';

export interface SyncBootstrapResult {
  runId: number;
  status: 'success' | 'skipped';
  counts?: { teams: number; elementTypes: number; gameweeks: number; players: number };
}

/**
 * Загрузка bootstrap-static: команды, позиции, туры, игроки.
 * Позже эту джобу вызовет BullMQ-процессор по расписанию.
 */
@Injectable()
export class SyncBootstrapJob {
  private readonly logger = new Logger(SyncBootstrapJob.name);

  constructor(
    private readonly fpl: FplApiClient,
    private readonly dataSource: DataSource,
    private readonly syncRuns: SyncRunsService,
    private readonly teams: TeamsService,
    private readonly elementTypes: ElementTypesService,
    private readonly gameweeks: GameweeksService,
    private readonly players: PlayersService,
    private readonly outbox: OutboxService,
  ) {}

  async run(opts: { force?: boolean } = {}): Promise<SyncBootstrapResult> {
    const runId = await this.syncRuns.start(ENDPOINT);
    let hash: string | undefined;
    const correlationId = randomUUID();
    try {
      const response = await this.fpl.getBootstrapStatic();
      hash = response.hash;
      const { data } = response;

      if (!opts.force && hash === (await this.syncRuns.lastSuccessHash(ENDPOINT))) {
        await this.syncRuns.finish(runId, { status: 'skipped', payloadHash: hash });
        this.logger.log(`Ответ не изменился (хэш ${hash.slice(0, 8)}), загрузка пропущена`);
        return { runId, status: 'skipped' };
      }

      // Всё в одной транзакции: либо обновились все таблицы, либо ни одна
      const { counts, total } = await this.dataSource.transaction(async (manager) => {
        const counts = {
          teams: await this.teams.upsertFromApi(data.teams, manager),
          elementTypes: await this.elementTypes.upsertFromApi(data.element_types, manager),
          gameweeks: await this.gameweeks.upsertFromApi(data.events, manager),
          players: await this.players.upsertFromApi(data.elements, manager, correlationId),
        };
        const total = counts.teams + counts.elementTypes + counts.gameweeks + counts.players;

        await this.syncRuns.finish(
          runId,
          { status: 'success', itemsCount: total, payloadHash: hash },
          manager,
        );
        await this.outbox.add(
          SnapshotReadyV1,
          {
            gameweek_number: await this.gameweeks.currentOrNextNumber(manager),
            updated: ['teams', 'gameweeks', 'players'],
            sync_run_id: runId,
          },
          manager,
          { correlationId },
        );
        return { counts, total };
      });

      this.logger.log(`Готово: ${JSON.stringify(counts)}`);
      return { runId, status: 'success', counts };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.syncRuns.finish(runId, { status: 'failed', error: message, payloadHash: hash });
      this.logger.error(`sync-bootstrap упал: ${message}`);
      throw e;
    }
  }
}
