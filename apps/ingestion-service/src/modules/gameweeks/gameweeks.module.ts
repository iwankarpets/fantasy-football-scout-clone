import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gameweek } from '../../database/entities/gameweek.entity';
import { GameweeksRepository } from './gameweeks.repository';
import { GameweeksService } from './gameweeks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Gameweek])],
  providers: [GameweeksRepository, GameweeksService],
  exports: [GameweeksService],
})
export class GameweeksModule {}
