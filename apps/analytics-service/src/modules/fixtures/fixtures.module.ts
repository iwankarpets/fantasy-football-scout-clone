import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { TeamDifficultyController } from './team-difficulty.controller';
import { TeamDifficultyRepository } from './team-difficulty.repository';
import { TeamDifficultyService } from './team-difficulty.service';

@Module({
  imports: [ConfigModule],
  controllers: [TeamDifficultyController],
  providers: [InternalApiKeyGuard, TeamDifficultyService, TeamDifficultyRepository],
  exports: [TeamDifficultyService],
})
export class FixturesModule {}
