import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { parseWith } from '../common/zod.util';
import { SettingsService, updateSettingsSchema } from './settings.service';

@ApiTags('settings')
@ApiSecurity('internal-key')
@Controller('internal/users/:userId/settings')
@UseGuards(InternalApiKeyGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Notification settings, timezone and language' })
  get(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.get(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Partial update; publishes user.settings_changed' })
  update(@Param('userId', ParseUUIDPipe) userId: string, @Body() body: unknown) {
    return this.service.update(userId, parseWith(updateSettingsSchema, body));
  }
}
