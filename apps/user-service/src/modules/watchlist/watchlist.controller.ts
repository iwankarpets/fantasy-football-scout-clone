import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { WatchlistService } from './watchlist.service';

@ApiTags('watchlist')
@ApiSecurity('internal-key')
@Controller('internal/users/:userId/watchlist')
@UseGuards(InternalApiKeyGuard)
export class WatchlistController {
  constructor(private readonly service: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: 'Watched players of a user' })
  list(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.list(userId);
  }

  @Put(':playerId')
  @ApiOperation({ summary: 'Start watching a player (idempotent)' })
  add(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('playerId', ParseIntPipe) playerId: number,
  ) {
    return this.service.add(userId, playerId);
  }

  @Delete(':playerId')
  @ApiOperation({ summary: 'Stop watching a player (idempotent)' })
  remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('playerId', ParseIntPipe) playerId: number,
  ) {
    return this.service.remove(userId, playerId);
  }
}
