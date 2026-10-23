import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BOT_COMMANDS, BotCommand, COMMANDS } from './commands';
 
@Module({
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