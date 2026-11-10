import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Watchlist } from '../../database/entities/watchlist.entity';
import { EventsModule } from '../../events/events.module';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { WatchlistController } from './watchlist.controller';
import { WatchlistRepository } from './watchlist.repository';
import { WatchlistService } from './watchlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([Watchlist, User]), EventsModule],
  controllers: [WatchlistController],
  providers: [WatchlistService, WatchlistRepository, InternalApiKeyGuard],
})
export class WatchlistModule {}
