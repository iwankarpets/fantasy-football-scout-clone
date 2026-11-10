import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSettings } from '../../database/entities/notification-settings.entity';
import { User } from '../../database/entities/user.entity';
import { EventsModule } from '../../events/events.module';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { SettingsController } from './settings.controller';
import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationSettings, User]), EventsModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository, InternalApiKeyGuard],
  exports: [SettingsRepository],
})
export class SettingsModule {}
