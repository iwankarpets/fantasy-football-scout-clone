import { Controller, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { TeamDifficultyService } from './team-difficulty.service';

@ApiTags('fixtures')
@ApiSecurity('internal-key')
@Controller()
@UseGuards(InternalApiKeyGuard)
export class TeamDifficultyController {
  constructor(private readonly service: TeamDifficultyService) {}

  @Post('internal/fixtures/difficulty/recalculate')
  @ApiOperation({ summary: 'Recalculate team fixture difficulty (horizons 3 and 5)' })
  recalculate() {
    return this.service.recalculate();
  }

  @Get('fixtures/difficulty')
  @ApiOperation({
    summary: 'Fixture difficulty by team, easiest first',
    description: 'Average FPL difficulty (1 easy, 5 hard) of upcoming matches in the window.',
  })
  @ApiQuery({ name: 'horizon', required: false, type: Number, description: '3 (default) or 5' })
  list(@Query('horizon', new ParseIntPipe({ optional: true })) horizon?: number) {
    return this.service.list(horizon);
  }
}
