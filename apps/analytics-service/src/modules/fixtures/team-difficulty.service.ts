import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { computeTeamDifficulty, DIFFICULTY_HORIZONS } from './team-difficulty.calc';
import { TeamDifficultyItemDto, TeamDifficultyRepository } from './team-difficulty.repository';

@Injectable()
export class TeamDifficultyService {
  private readonly logger = new Logger(TeamDifficultyService.name);

  constructor(private readonly repository: TeamDifficultyRepository) {}

  async recalculate(): Promise<{ rows: number; as_of_gameweek: number | null }> {
    const input = await this.repository.loadInput();
    const computed = computeTeamDifficulty(input);
    const rows = await this.repository.upsertMany(computed);
    const asOf = computed[0]?.as_of_gameweek ?? null;
    this.logger.log(`team_fixture_difficulty: ${rows} rows, as_of_gameweek=${asOf}`);
    return { rows, as_of_gameweek: asOf };
  }

  list(horizon = 3): Promise<TeamDifficultyItemDto[]> {
    if (!(DIFFICULTY_HORIZONS as readonly number[]).includes(horizon)) {
      throw new BadRequestException(`horizon must be one of: ${DIFFICULTY_HORIZONS.join(', ')}`);
    }
    return this.repository.findLatest(horizon);
  }
}
