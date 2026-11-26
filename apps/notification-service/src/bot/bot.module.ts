import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BOT_COMMANDS, BotCommand, COMMANDS } from './commands';
import { UserApiModule } from '../clients/user-api/user-api.module';
import { RateLimitService } from './rate-limit/rate-limit.service';
import { AnalyticsApiModule } from '../clients/analytics-api/analytics-api.module';

@Module({
  imports: [UserApiModule, AnalyticsApiModule],
  providers: [
    BotService,
    RateLimitService,
    ...COMMANDS,
    {
      provide: BOT_COMMANDS,
      useFactory: (...commands: BotCommand[]) => commands,
      inject: COMMANDS,
    },
  ],
  exports: [BotService],
})
export class BotModule {}
