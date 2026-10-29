import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerGameweekStats } from '../../database/entities/player-gameweek-stats.entity';
import { PlayerGameweekStatsRepository } from './player-gameweek-stats.repository';
import { PlayerGameweekStatsService } from './player-gameweek-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerGameweekStats])],
  providers: [PlayerGameweekStatsRepository, PlayerGameweekStatsService],
  exports: [PlayerGameweekStatsService],
})
export class PlayerGameweekStatsModule {}