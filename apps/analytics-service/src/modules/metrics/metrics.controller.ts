import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { RecalculateResult } from './metrics.types';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';

@ApiTags('metrics')
@ApiSecurity('internal-key')
@Controller('internal/metrics')
@UseGuards(InternalApiKeyGuard)
export class MetricsController {
  constructor(private readonly service: MetricsService) {}

  @Post('recalculate')
  @ApiOperation({
    summary: 'Recalculate player metrics',
    description:
      'Computes form, minutes reliability, xGI per 90, points per million, ownership trend, ' +
      'score and position rank as of the last finished gameweek that has loaded history. ' +
      'Returns as_of_gameweek = null when there is no data yet.',
  })
  recalculate(): Promise<RecalculateResult> {
    return this.service.recalculate();
  }
}
