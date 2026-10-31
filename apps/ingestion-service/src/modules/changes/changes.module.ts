import { Module } from '@nestjs/common';
import { PlayerChangesRepository } from './player-changes.repository';
import { PlayerChangesService } from './player-changes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerChange } from '../../database/entities/player-change.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerChange])],
  providers: [PlayerChangesRepository, PlayerChangesService],
  exports: [PlayerChangesService],
})
export class ChangesModule {}
