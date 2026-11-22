import { BadRequestException, Injectable } from '@nestjs/common';
import { PlayersRepository } from './players.repository';
import { PlayerSearchItemDto } from './player-search-item.dto';
import { transliterate } from './transliterate';

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
}
