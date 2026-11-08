import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { SnapshotReadyV1 } from '@app/contracts';
import { FplApiClient, sleep } from '../clients/fpl-api/fpl-api.client';
import { OutboxService } from '../events/outbox/outbox.service';
import { GameweeksService } from '../modules/gameweeks/gameweeks.service';
import { PlayerGameweekStatsService } from '../modules/player-gameweek-stats/player-gameweek-stats.service';
import { PlayersService } from '../modules/players/players.service';
import { SyncRunsService } from '../modules/sync-runs/sync-runs.service';

const ENDPOINT = 'element-summary';
/** This many consecutive errors will be treated as an FPL block or outage, stopping the process */
const MAX_CONSECUTIVE_FAILURES = 3;

export interface SyncPlayerHistoryOptions {
  /** Only process these players (useful for testing specific IDs or retrying missed ones) */
  playerIds?: number[];
  /** Only process the first N players: useful for dry runs */
  limit?: number;
  /** true: only fetch players with completed matches that are not yet in player_gameweek_stats */
  onlyNewMatches?: boolean;
  /** Window for onlyNewMatches, in days (default is 3) */
  days?: number;
}

/**
 * Loads player match history from element-summary/{id}.history
 * into player_gameweek_stats. Requests are made sequentially with a delay.
 */
@Injectable()
export class SyncPlayerHistoryJob {
  private readonly logger = new Logger(SyncPlayerHistoryJob.name);
  private running = false;

  constructor(
    private readonly fpl: FplApiClient,
    private readonly dataSource: DataSource,
    private readonly syncRuns: SyncRunsService,
    private readonly players: PlayersService,
    private readonly stats: PlayerGameweekStatsService,
    private readonly outbox: OutboxService,
    private readonly gameweeks: GameweeksService,
  ) {}

  /** For the admin panel: starts traversal in the background and returns the runId immediately. */
  async start(opts: SyncPlayerHistoryOptions = {}): Promise<{ runId: number; status: 'started' }> {
    if (this.running) {
      throw new Error('sync-player-history is already running');
    }
    this.running = true;

    try {
      const runId = await this.syncRuns.start(ENDPOINT);
      void this.execute(runId, opts).finally(() => {
        this.running = false;
      });
      return { runId, status: 'started' };
    } catch (e) {
      this.running = false;
      throw e;
    }
  }

  /** For the queue worker: executes the traversal and waits for completion so concurrency: 1 prevents overlaps. */
  async run(opts: SyncPlayerHistoryOptions = {}): Promise<{ runId: number }> {
    if (this.running) {
      throw new Error('sync-player-history is already running');
    }
    this.running = true;
    try {
      const runId = await this.syncRuns.start(ENDPOINT);
      await this.execute(runId, opts);
      return { runId };
    } finally {
      this.running = false;
    }
  }

  private async resolveIds(opts: SyncPlayerHistoryOptions): Promise<number[]> {
    let ids: number[];
    if (opts.playerIds) {
      ids = opts.playerIds;
    } else if (opts.onlyNewMatches) {
      ids = await this.players.getIdsWithNewMatches(opts.days ?? 3);
    } else {
      ids = await this.players.getAllIds();
    }

    return opts.limit ? ids.slice(0, opts.limit) : ids;
  }

  /** Finalizes the status and triggers snapshot.ready (if any data was loaded) in a single transaction. */
  private async complete(
    runId: number,
    patch: { status: 'success' | 'failed'; itemsCount: number; error?: string },
    correlationId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.syncRuns.finish(runId, patch, manager);
      if (patch.itemsCount > 0) {
        await this.outbox.add(
          SnapshotReadyV1,
          {
            gameweek_number: await this.gameweeks.currentOrNextNumber(manager),
            updated: ['player_history'],
            sync_run_id: runId,
          },
          manager,
          { correlationId },
        );
      }
    });
  }

  private async execute(runId: number, opts: SyncPlayerHistoryOptions): Promise<void> {
    try {
      const correlationId = randomUUID();
      const ids = await this.resolveIds(opts);
      if (ids.length === 0) {
        this.logger.log('No players to fetch history for');
      }

      let rows = 0;
      let consecutiveFailures = 0;
      let aborted = false;
      const failed: number[] = [];

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        try {
          const { data } = await this.fpl.getElementSummary(id);
          rows += await this.stats.upsertFromApi(data.history);
          consecutiveFailures = 0;
        } catch (e) {
          failed.push(id);
          consecutiveFailures++;
          this.logger.warn(`element-summary/${id}: ${e instanceof Error ? e.message : String(e)}`);
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            aborted = true;
            break;
          }
        }

        if ((i + 1) % 50 === 0) {
          this.logger.log(`Processed ${i + 1}/${ids.length} players`);
        }
        await sleep(this.fpl.requestDelayMs);
      }

      if (aborted) {
        const error = `Aborted: ${MAX_CONSECUTIVE_FAILURES} consecutive errors. Skipped: ${failed.join(', ')}`;
        await this.complete(runId, { status: 'failed', itemsCount: rows, error }, correlationId);
        this.logger.error(error);
      } else if (failed.length > 0) {
        const error = `Failed to fetch ${failed.length} out of ${ids.length} players: ${failed.slice(0, 20).join(', ')}`;
        await this.complete(runId, { status: 'failed', itemsCount: rows, error }, correlationId);
        this.logger.error(error);
      } else {
        await this.complete(runId, { status: 'success', itemsCount: rows }, correlationId);
        this.logger.log(`Done: ${ids.length} players, ${rows} rows`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.syncRuns.finish(runId, { status: 'failed', error: message });
      this.logger.error(`sync-player-history failed: ${message}`);
    }
  }
}
