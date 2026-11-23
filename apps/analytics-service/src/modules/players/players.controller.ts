import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { PlayersService } from './players.service ';
import { PlayerSearchItemDto } from './dto/player-search-item.dto';
import { PlayerTopResponseDto, POSITIONS, TOP_METRICS } from './top-metrics';

@ApiTags('players')
@ApiSecurity('internal-key')
@Controller('players')
@UseGuards(InternalApiKeyGuard)
export class PlayersController {
  constructor(private readonly service: PlayersService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search players by name',
    description:
      'Fuzzy search by web name, first and second name. Accepts Latin and Cyrillic ' +
      '(Cyrillic is transliterated). Best matches first, ties broken by total points.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'At least 2 characters, e.g. salah or салах',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Default 5, max 10' })
  search(
    @Query('q') q = '',
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PlayerSearchItemDto[]> {
    return this.service.search(q, limit);
  }

  @Get('top')
  @ApiOperation({ summary: 'Top players by metric and position' })
  @ApiQuery({ name: 'metric', required: false, enum: TOP_METRICS })
  @ApiQuery({ name: 'position', required: false, enum: POSITIONS })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Default 10, max 50' })
  @ApiQuery({
    name: 'gameweek',
    required: false,
    type: Number,
    description: 'Default: latest calculated',
  })
  top(
    @Query('metric') metric?: string,
    @Query('position') position?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('gameweek', new ParseIntPipe({ optional: true })) gameweek?: number,
  ): Promise<PlayerTopResponseDto> {
    return this.service.top(metric, position, limit, gameweek);
  }
}
