import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { PlayerSearchItemDto } from './player-search-item.dto';
import { PlayersService } from './players.service ';

@Controller('players')
@UseGuards(InternalApiKeyGuard)
export class PlayersController {
  constructor(private readonly service: PlayersService) {}

  /** GET /players/search?q=салах&limit=5 */
  @Get('search')
  search(
    @Query('q') q = '',
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PlayerSearchItemDto[]> {
    return this.service.search(q, limit);
  }
}
