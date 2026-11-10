import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { EventsModule } from '../../events/events.module';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { SettingsModule } from '../settings/settings.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), EventsModule, SettingsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, InternalApiKeyGuard],
})
export class UsersModule {}
