import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlayersController } from './players.controller';
import { PlayersRepository } from './players.repository';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { PlayersService } from './players.service ';

@Module({
  imports: [ConfigModule],
  controllers: [PlayersController],
  providers: [InternalApiKeyGuard, PlayersService, PlayersRepository],
  exports: [PlayersService],
})
export class PlayersModule {}
