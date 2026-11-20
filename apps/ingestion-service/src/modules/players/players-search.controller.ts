import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../../admin/internal-key.guard'; // поправьте путь, если guard лежит в другом месте
import { PlayersService } from './players.service';

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

@ApiTags('internal')
@ApiSecurity('internal-key')
@Controller('internal/players')
@UseGuards(InternalApiKeyGuard)
export class PlayersSearchController {
  constructor(private readonly players: PlayersService) {}

  /** GET /internal/players/search?q=salah&limit=5 */
  @Get('search')
  @ApiOperation({ summary: 'Search players by name (for the bot: /watch)' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'At least 2 characters' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'From 1 to 10, default 5',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of { id, web_name, team, position, status, now_cost }',
  })
  @ApiResponse({ status: 400, description: 'q is too short or limit is out of range' })
  @ApiResponse({ status: 403, description: 'ACCESS_DENIED: invalid or missing x-internal-key' })
  search(@Query('q') q?: string, @Query('limit') limit?: string) {
    const query = (q ?? '').trim();
    if (query.length < MIN_QUERY_LENGTH) {
      throw new BadRequestException(`q must be at least ${MIN_QUERY_LENGTH} characters`);
    }

    const n = limit ? Number(limit) : DEFAULT_LIMIT;
    if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) {
      throw new BadRequestException(`limit must be an integer from 1 to ${MAX_LIMIT}`);
    }

    return this.players.search(query, n);
  }
}
