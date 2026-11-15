import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BOT_COMMANDS, BotCommand, COMMANDS } from './commands';
import { UserApiModule } from '../clients/user-api/user-api.module';

@Module({
  imports: [UserApiModule],
  providers: [
    BotService,
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
