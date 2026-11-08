import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerSnapshot } from '../../database/entities/player-snapshot.entity';
import { PlayerSnapshotsRepository } from './player-snapshots.repository';
import { PlayerSnapshotsService } from './player-snapshots.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerSnapshot])],
  providers: [PlayerSnapshotsRepository, PlayerSnapshotsService],
  exports: [PlayerSnapshotsService],
})
export class SnapshotsModule {}
