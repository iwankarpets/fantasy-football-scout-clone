import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';

@ApiTags('sync')
@ApiSecurity('internal-key')
@Controller('internal')
@UseGuards(InternalApiKeyGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Run sync from ingestion-service',
    description:
      'Reloads reference data (teams, gameweeks, players, fixtures, element types) and ' +
      'player match history into the local read tables. Does not recalculate metrics: ' +
      'use POST /internal/metrics/recalculate for that.',
  })
  @ApiQuery({
    name: 'full',
    required: false,
    type: Boolean,
    description:
      'true: reload history from round 1. Default: from the last loaded round minus one.',
  })
  run(@Query('full') full?: string) {
    return this.sync.run({ reference: true, history: true, fullHistory: full === 'true' });
  }
}
