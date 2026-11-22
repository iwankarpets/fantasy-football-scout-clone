import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { PlayersService } from './players.service ';
import { PlayerSearchItemDto } from './player-search-item.dto';

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
}
