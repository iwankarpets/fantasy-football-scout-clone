import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../../database/entities/player.entity';
import { PlayersRepository } from './players.repository';
import { PlayersService } from './players.service';
import { ChangesModule } from '../changes/changes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Player]), ChangesModule],
  providers: [PlayersRepository, PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
