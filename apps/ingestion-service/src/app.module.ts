import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { FplApiModule } from './clients/fpl-api/fpl-api.module';
import { JobsModule } from './jobs/jobs.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { PlayersModule } from './modules/players/players.module';
import { TeamsModule } from './modules/teams/teams.module';
import { FixturesModule } from './modules/fixtures/fixtures.module';
import { GameweeksModule } from './modules/gameweeks/gameweeks.module';
import { ChangesModule } from './modules/changes/changes.module';
import { SyncRunsModule } from './modules/sync-runs/sync-runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['apps/ingestion-service/.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: false, // схема только через миграции
      }),
    }),
    FplApiModule,
    JobsModule,
    EventsModule,
    AdminModule,
    PlayersModule,
    TeamsModule,
    FixturesModule,
    GameweeksModule,
    ChangesModule,
    SyncRunsModule,
  ],
})
export class AppModule {}
