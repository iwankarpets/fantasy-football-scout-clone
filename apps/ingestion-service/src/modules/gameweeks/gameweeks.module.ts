import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gameweek } from '../../database/entities/gameweek.entity';
import { GameweeksRepository } from './gameweeks.repository';
import { GameweeksService } from './gameweeks.service';
import { EventsModule } from '../../events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Gameweek]), EventsModule],
  providers: [GameweeksRepository, GameweeksService],
  exports: [GameweeksService],
})
export class GameweeksModule {}
