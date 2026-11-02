import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SyncBootstrapJob } from '../jobs/sync-bootstrap.job';
import { InternalApiKeyGuard } from './internal-key.guard';
import { SyncFixturesJob } from '../jobs/sync-fixtures.job';
import { SyncPlayerHistoryJob } from '../jobs/sync-player-history.job';
import { DailySnapshotJob } from '../jobs/daily-snapshot.job';
import { SchedulerService } from '../scheduler/scheduler.service';

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
    private readonly scheduler: SchedulerService
  ) {}

  /** POST /admin/sync/bootstrap?force=true : force=true игнорирует совпадение хэша */
  @Post('sync/bootstrap')
  @ApiOperation({ summary: 'Загрузить bootstrap-static: команды, позиции, туры, игроки' })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'true: выполнить загрузку, даже если ответ FPL не изменился (хэш совпал)',
  })
  @ApiResponse({ status: 201, description: 'success (с counts) или skipped (хэш не изменился)' })
  @ApiResponse({ status: 403, description: 'ACCESS_DENIED: неверный или отсутствующий x-internal-key' })
  @ApiResponse({ status: 502, description: 'UPSTREAM_BAD_RESPONSE: формат ответа FPL не совпал со схемой' })
  @ApiResponse({ status: 503, description: 'UPSTREAM_UNAVAILABLE: FPL недоступен после повторов' })
  runBootstrap(@Query('force') force?: string) {
    return this.syncBootstrap.run({ force: force === 'true' });
  }

  @Post('sync/fixtures')
  @ApiOperation({ summary: 'Загрузить матчи из /fixtures/ (сложность, счёт, время начала)' })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'true: выполнить загрузку, даже если ответ FPL не изменился (хэш совпал)',
  })
  @ApiResponse({ status: 201, description: 'success (с count) или skipped (хэш не изменился)' })
  @ApiResponse({ status: 403, description: 'ACCESS_DENIED: неверный или отсутствующий x-internal-key' })
  @ApiResponse({ status: 502, description: 'UPSTREAM_BAD_RESPONSE: формат ответа FPL не совпал со схемой' })
  @ApiResponse({ status: 503, description: 'UPSTREAM_UNAVAILABLE: FPL недоступен после повторов' })
  runFixtures(@Query('force') force?: string) {
    return this.syncFixtures.run({ force: force === 'true' });
  }

  @Post('sync/player-history')
  @ApiOperation({ summary: 'Загрузить историю матчей игроков (element-summary) в фоне' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Только первые N игроков (для пробного запуска)',
  })
  @ApiResponse({ status: 201, description: 'started: обход запущен, runId для проверки в sync_runs' })
  @ApiResponse({ status: 403, description: 'ACCESS_DENIED: неверный или отсутствующий x-internal-key' })
  runPlayerHistory(@Query('limit') limit?: string) {
    return this.syncPlayerHistory.start({ limit: limit ? Number(limit) : undefined });
  }

  /** POST /admin/snapshot/daily?force=true : force=true заменяет сегодняшний снимок */
  @Post('snapshot/daily')
  @ApiOperation({ summary: 'Суточный снимок игроков: цена, статус, владение (читает players, к FPL не ходит)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean, description: 'true: заменить снимок за сегодня' })
  @ApiResponse({ status: 201, description: 'success (с count) или skipped (снимок за сегодня уже есть)' })
  @ApiResponse({ status: 403, description: 'ACCESS_DENIED: неверный или отсутствующий x-internal-key' })
  runDailySnapshot(@Query('force') force?: string) {
    return this.dailySnapshot.run({ force: force === 'true' });
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Какие задачи стоят в расписании и когда следующий запуск' })
  getSchedule() {
    return this.scheduler.list();
  }
}
