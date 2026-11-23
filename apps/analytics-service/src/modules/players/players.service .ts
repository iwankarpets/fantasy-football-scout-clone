import { BadRequestException, Injectable } from '@nestjs/common';
import { PlayersRepository } from './players.repository';
import { PlayerSearchItemDto } from './dto/player-search-item.dto';
import { transliterate } from './transliterate';
import {
  DEFAULT_TOP_LIMIT,
  MAX_TOP_LIMIT,
  PlayerTopResponseDto,
  Position,
  POSITIONS,
  TOP_METRICS,
  TopMetric,
} from './top-metrics';

export const MIN_QUERY_LENGTH = 2;
export const DEFAULT_SEARCH_LIMIT = 5;
export const MAX_SEARCH_LIMIT = 10;

@Injectable()
export class PlayersService {
  constructor(private readonly repository: PlayersRepository) {}

  search(query: string, limit?: number): Promise<PlayerSearchItemDto[]> {
    const term = transliterate(query.trim().replace(/\s+/g, ' '));
    if (term.length < MIN_QUERY_LENGTH) {
      throw new BadRequestException(`q must be at least ${MIN_QUERY_LENGTH} characters`);
    }

    const size = limit ?? DEFAULT_SEARCH_LIMIT;
    if (size < 1 || size > MAX_SEARCH_LIMIT) {
      throw new BadRequestException(`limit must be between 1 and ${MAX_SEARCH_LIMIT}`);
    }

    return this.repository.search(term, size);
  }

  async top(
    metric: string = 'score',
    position?: string,
    limit: number = DEFAULT_TOP_LIMIT,
    gameweek?: number,
  ): Promise<PlayerTopResponseDto> {
    if (!(TOP_METRICS as readonly string[]).includes(metric)) {
      throw new BadRequestException(`metric must be one of: ${TOP_METRICS.join(', ')}`);
    }
    const pos = position?.toUpperCase();
    if (pos && !(POSITIONS as readonly string[]).includes(pos)) {
      throw new BadRequestException(`position must be one of: ${POSITIONS.join(', ')}`);
    }
    if (limit < 1 || limit > MAX_TOP_LIMIT) {
      throw new BadRequestException(`limit must be between 1 and ${MAX_TOP_LIMIT}`);
    }

    const gw = gameweek ?? (await this.repository.latestGameweek());
    const base = { gameweek: gw, metric: metric as TopMetric, position: (pos as Position) ?? null };
    if (!gw) {
      return { ...base, items: [] };
    }

    const items = await this.repository.top(
      metric as TopMetric,
      pos as Position | undefined,
      limit,
      gw,
    );
    return { ...base, items };
  }
}
