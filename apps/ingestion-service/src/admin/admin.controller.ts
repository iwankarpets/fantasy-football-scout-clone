import { BadRequestException, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SyncBootstrapJob } from '../jobs/sync-bootstrap.job';
import { InternalApiKeyGuard } from './internal-key.guard';
import { SyncFixturesJob } from '../jobs/sync-fixtures.job';
import { SyncPlayerHistoryJob } from '../jobs/sync-player-history.job';
import { DailySnapshotJob } from '../jobs/daily-snapshot.job';
import { SchedulerService } from '../scheduler/scheduler.service';
import { DeadlineCheckJob } from '../jobs/deadline-check.job';
import { OutboxCleanupJob } from '../jobs/outbox-cleanup.job';

@ApiTags('admin')
@ApiSecurity('internal-key')
@Controller('admin')
@UseGuards(InternalApiKeyGuard)
export class AdminController {
  constructor(
    private readonly syncBootstrap: SyncBootstrapJob,
    private readonly syncFixtures: SyncFixturesJob,
    private readonly syncPlayerHistory: SyncPlayerHistoryJob,
    private readonly dailySnapshot: DailySnapshotJob,
    private readonly scheduler: SchedulerService,
    private readonly deadlineCheck: DeadlineCheckJob,
    private readonly outboxCleanup: OutboxCleanupJob,
  ) {}

  /** POST /admin/sync/bootstrap?force=true : force=true ignores hash match */
  @Post('sync/bootstrap')
  @ApiOperation({ summary: 'Load bootstrap-static: teams, positions, gameweeks, players' })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'true: force sync even if the FPL response has not changed (hash match)',
  })
  @ApiResponse({
    status: 201,
    description: 'success (with counts) or skipped (hash did not change)',
  })
  @ApiResponse({
    status: 403,
    description: 'ACCESS_DENIED: invalid or missing x-internal-key',
  })
  @ApiResponse({
    status: 502,
    description: 'UPSTREAM_BAD_RESPONSE: FPL response format does not match the schema',
  })
  @ApiResponse({
    status: 503,
    description: 'UPSTREAM_UNAVAILABLE: FPL is unavailable after retries',
  })
  runBootstrap(@Query('force') force?: string) {
    return this.syncBootstrap.run({ force: force === 'true' });
  }

  @Post('sync/fixtures')
  @ApiOperation({ summary: 'Load fixtures from /fixtures/ (difficulty, score, kickoff time)' })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'true: force sync even if the FPL response has not changed (hash match)',
  })
  @ApiResponse({
    status: 201,
    description: 'success (with count) or skipped (hash did not change)',
  })
  @ApiResponse({
    status: 403,
    description: 'ACCESS_DENIED: invalid or missing x-internal-key',
  })
  @ApiResponse({
    status: 502,
    description: 'UPSTREAM_BAD_RESPONSE: FPL response format does not match the schema',
  })
  @ApiResponse({
    status: 503,
    description: 'UPSTREAM_UNAVAILABLE: FPL is unavailable after retries',
  })
  runFixtures(@Query('force') force?: string) {
    return this.syncFixtures.run({ force: force === 'true' });
  }

  /** POST /admin/snapshot/daily?force=true : force=true replaces today's snapshot */
  @Post('snapshot/daily')
  @ApiOperation({
    summary:
      'Daily player snapshot: price, status, ownership (reads from players table, no FPL request)',
  })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'true: replace the snapshot for today',
  })
  @ApiResponse({
    status: 201,
    description: 'success (with count) or skipped (snapshot for today already exists)',
  })
  @ApiResponse({
    status: 403,
    description: 'ACCESS_DENIED: invalid or missing x-internal-key',
  })
  runDailySnapshot(@Query('force') force?: string) {
    return this.dailySnapshot.run({ force: force === 'true' });
  }

  @Get('schedule')
  @ApiOperation({ summary: 'List scheduled tasks and their next run times' })
  getSchedule() {
    return this.scheduler.list();
  }

  /** POST /admin/sync/player-history?onlyNew=true&days=3 : runs in background, check sync_runs for result */
  @Post('sync/player-history')
  @ApiOperation({ summary: 'Load player match history (element-summary) in the background' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Only the first N players (useful for dry runs)',
  })
  @ApiQuery({
    name: 'ids',
    required: false,
    type: String,
    description: 'Comma-separated player IDs (to retry missing ones)',
  })
  @ApiQuery({
    name: 'onlyNew',
    required: false,
    type: Boolean,
    description:
      'true: only players with completed matches that are not yet in player_gameweek_stats',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Time window for onlyNew in days (default is 3)',
  })
  @ApiResponse({
    status: 201,
    description: 'started: traversal initiated, use runId to check status in sync_runs',
  })
  runPlayerHistory(
    @Query('limit') limit?: string,
    @Query('ids') ids?: string,
    @Query('onlyNew') onlyNew?: string,
    @Query('days') days?: string,
  ) {
    return this.syncPlayerHistory.start({
      limit: limit ? Number(limit) : undefined,
      playerIds: ids ? ids.split(',').map(Number).filter(Number.isInteger) : undefined,
      onlyNewMatches: onlyNew === 'true',
      days: days ? Number(days) : undefined,
    });
  }

  /** POST /admin/deadline-check?now=2026-11-20T10:00:00Z : now нужен для проверки порогов */
  @Post('deadline-check')
  @ApiOperation({ summary: 'Run deadline check now (writes gameweek.deadline_approaching if due)' })
  @ApiQuery({
    name: 'now',
    required: false,
    type: String,
    description: 'ISO date to simulate the current time (for testing thresholds)',
  })
  @ApiResponse({
    status: 201,
    description: 'no_deadline | not_due | published | already_sent',
  })
  @ApiResponse({ status: 403, description: 'ACCESS_DENIED: invalid or missing x-internal-key' })
  runDeadlineCheck(@Query('now') now?: string) {
    const parsed = now ? new Date(now) : undefined;
    if (parsed && Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Now must be a valid ISO date');
    }
    return this.deadlineCheck.run({ now: parsed });
  }

  /** POST /admin/outbox/cleanup?days=7 : удаляет отправленные события старше N дней */
  @Post('outbox/cleanup')
  @ApiOperation({ summary: 'Delete published outbox events older than the retention period' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Retention for regular events in days (default 7); dedup_key events keep 30',
  })
  @ApiResponse({ status: 201, description: 'Counts of deleted rows' })
  @ApiResponse({ status: 403, description: 'ACCESS_DENIED: invalid or missing x-internal-key' })
  runOutboxCleanup(@Query('days') days?: string) {
    const parsed = days ? Number(days) : undefined;
    if (parsed !== undefined && (!Number.isInteger(parsed) || parsed < 1)) {
      throw new BadRequestException('days must be a positive integer');
    }
    return this.outboxCleanup.run({ retentionDays: parsed });
  }
}
