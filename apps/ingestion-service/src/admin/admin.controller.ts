import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { SyncBootstrapJob } from '../jobs/sync-bootstrap.job';
import { InternalApiKeyGuard } from './internal-key.guard';

@Controller('admin')
@UseGuards(InternalApiKeyGuard)
export class AdminController {
  constructor(private readonly syncBootstrap: SyncBootstrapJob) {}

  /** POST /admin/sync/bootstrap?force=true : force=true игнорирует совпадение хэша */
  @Post('sync/bootstrap')
  runBootstrap(@Query('force') force?: string) {
    return this.syncBootstrap.run({ force: force === 'true' });
  }
}
