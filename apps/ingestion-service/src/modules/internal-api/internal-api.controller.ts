import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiService } from './internal-api.service';
import { InternalApiKeyGuard } from '../../admin/internal-key.guard';

@ApiTags('internal')
@ApiSecurity('internal-key')
@Controller('internal')
@UseGuards(InternalApiKeyGuard)
export class InternalApiController {
  constructor(private readonly service: InternalApiService) {}

  @Get('players')
  @ApiOperation({ summary: 'All players (fields needed for calculations, without raw)' })
  players() {
    return this.service.players();
  }

  @Get('teams')
  @ApiOperation({ summary: 'All teams (without raw)' })
  teams() {
    return this.service.teams();
  }

  @Get('gameweeks')
  @ApiOperation({ summary: 'All gameweeks (without raw)' })
  gameweeks() {
    return this.service.gameweeks();
  }

  @Get('fixtures')
  @ApiOperation({ summary: 'All fixtures with team difficulty' })
  fixtures() {
    return this.service.fixtures();
  }

  @Get('player-stats')
  @ApiOperation({ summary: 'Player match history for a range of rounds (max 10 rounds)' })
  @ApiQuery({ name: 'round_from', required: true, type: Number })
  @ApiQuery({ name: 'round_to', required: false, type: Number, description: 'Default: round_from' })
  playerStats(
    @Query('round_from', ParseIntPipe) roundFrom: number,
    @Query('round_to', new ParseIntPipe({ optional: true })) roundTo?: number,
  ) {
    return this.service.playerStats(roundFrom, roundTo);
  }

  @Get('player-snapshots')
  @ApiOperation({ summary: 'Daily player snapshots for the last N days (default 14, max 90)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  playerSnapshots(@Query('days', new ParseIntPipe({ optional: true })) days?: number) {
    return this.service.playerSnapshots(days);
  }

  @Get('element-types')
  @ApiOperation({ summary: 'Player positions: 1 GKP, 2 DEF, 3 MID, 4 FWD' })
  elementTypes() {
    return this.service.elementTypes();
  }
}
