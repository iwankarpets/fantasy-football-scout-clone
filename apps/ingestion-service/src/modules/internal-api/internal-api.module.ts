import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternalApiController } from './internal-api.controller';
import { InternalApiService } from './internal-api.service';
import { InternalReadRepository } from './internal-read.repository';
import { Player } from '../../database/entities/player.entity';
import { Team } from '../../database/entities/team.entity';
import { Gameweek } from '../../database/entities/gameweek.entity';
import { Fixture } from '../../database/entities/fixture.entity';
import { PlayerGameweekStats } from '../../database/entities/player-gameweek-stats.entity';
import { PlayerSnapshot } from '../../database/entities/player-snapshot.entity';
import { InternalApiKeyGuard } from '../../admin/internal-key.guard';
import { ElementType } from '../../database/entities/element-type.entity';

/** Внутренняя выдача данных для Analytics. Доступна только по служебному ключу. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Player,
      Team,
      Gameweek,
      Fixture,
      PlayerGameweekStats,
      PlayerSnapshot,
      ElementType,
    ]),
  ],
  controllers: [InternalApiController],
  providers: [InternalApiKeyGuard, InternalApiService, InternalReadRepository],
})
export class InternalApiModule {}
