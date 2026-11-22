import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { SyncService } from './sync.service';

@Controller('internal')
@UseGuards(InternalApiKeyGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  /**
   * Ручной запуск: справочники и история игроков.
   * POST /internal/sync            история с последнего загруженного тура
   * POST /internal/sync?full=true  история с 1-го тура
   */
  @Post('sync')
  run(@Query('full') full?: string) {
    return this.sync.run({ reference: true, history: true, fullHistory: full === 'true' });
  }
}
