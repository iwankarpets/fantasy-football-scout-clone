import { Module } from '@nestjs/common';
import { FplApiModule } from '../clients/fpl-api/fpl-api.module';
import { ElementTypesModule } from '../modules/element-types/element-types.module';
import { GameweeksModule } from '../modules/gameweeks/gameweeks.module';
import { PlayersModule } from '../modules/players/players.module';
import { SyncRunsModule } from '../modules/sync-runs/sync-runs.module';
import { TeamsModule } from '../modules/teams/teams.module';
import { SyncBootstrapJob } from './sync-bootstrap.job';

/** Позже добавятся BullMQ-очередь и остальные джобы (fixtures, history, snapshot, deadline). */
@Module({
  imports: [FplApiModule, TeamsModule, ElementTypesModule, GameweeksModule, PlayersModule, SyncRunsModule],
  providers: [SyncBootstrapJob],
  exports: [SyncBootstrapJob],
})
export class JobsModule {}
