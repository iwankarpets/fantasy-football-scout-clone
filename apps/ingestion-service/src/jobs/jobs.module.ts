import { Module } from '@nestjs/common';
import { FplApiModule } from '../clients/fpl-api/fpl-api.module';
import { ElementTypesModule } from '../modules/element-types/element-types.module';
import { FixturesModule } from '../modules/fixtures/fixtures.module';
import { GameweeksModule } from '../modules/gameweeks/gameweeks.module';
import { PlayersModule } from '../modules/players/players.module';
import { SyncRunsModule } from '../modules/sync-runs/sync-runs.module';
import { TeamsModule } from '../modules/teams/teams.module';
import { SyncBootstrapJob } from './sync-bootstrap.job';
import { SyncFixturesJob } from './sync-fixtures.job';

/** Позже добавятся BullMQ-очередь и остальные джобы (history, snapshot, deadline). */
@Module({
  imports: [
    FplApiModule,
    TeamsModule,
    ElementTypesModule,
    GameweeksModule,
    PlayersModule,
    SyncRunsModule,
    FixturesModule,
  ],
  providers: [SyncBootstrapJob, SyncFixturesJob],
  exports: [SyncBootstrapJob, SyncFixturesJob],
})
export class JobsModule {}