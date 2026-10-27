import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SyncBootstrapJob } from '../jobs/sync-bootstrap.job';
import { InternalApiKeyGuard } from './internal-key.guard';

@ApiTags('admin')
@ApiSecurity('internal-key')
@Controller('admin')
@UseGuards(InternalApiKeyGuard)
export class AdminController {
  constructor(private readonly syncBootstrap: SyncBootstrapJob) {}

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
}