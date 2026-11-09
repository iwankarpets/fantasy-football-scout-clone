import { BadRequestException, Injectable } from '@nestjs/common';
import { InternalReadRepository } from './internal-read.repository';

/** Максимум туров за один запрос статистики: ограничивает размер ответа. */
export const MAX_ROUND_SPAN = 10;
export const DEFAULT_SNAPSHOT_DAYS = 14;
export const MAX_SNAPSHOT_DAYS = 90;

@Injectable()
export class InternalApiService {
  constructor(private readonly repository: InternalReadRepository) {}

  players() {
    return this.repository.findPlayers();
  }

  teams() {
    return this.repository.findTeams();
  }

  gameweeks() {
    return this.repository.findGameweeks();
  }

  fixtures() {
    return this.repository.findFixtures();
  }

  playerStats(roundFrom: number, roundTo?: number) {
    const to = roundTo ?? roundFrom;
    if (roundFrom < 1 || to < roundFrom) {
      throw new BadRequestException('round_from must be >= 1 and round_to >= round_from');
    }
    if (to - roundFrom + 1 > MAX_ROUND_SPAN) {
      throw new BadRequestException(`at most ${MAX_ROUND_SPAN} rounds per request`);
    }
    return this.repository.findStats(roundFrom, to);
  }

  playerSnapshots(days?: number) {
    const d = days ?? DEFAULT_SNAPSHOT_DAYS;
    if (d < 1 || d > MAX_SNAPSHOT_DAYS) {
      throw new BadRequestException(`days must be between 1 and ${MAX_SNAPSHOT_DAYS}`);
    }
    return this.repository.findSnapshotsSince(new Date(Date.now() - d * 24 * 60 * 60 * 1000));
  }

  elementTypes() {
    return this.repository.findElementTypes();
  }
}
