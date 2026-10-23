import { Injectable } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotCommand } from './bot-command.interface';
 
@Injectable()
export class TopCommand implements BotCommand {
  readonly name = 'top';
  readonly description = 'Топ игроков по форме';
  readonly inMenu = true;
 
  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      // TODO: запрос в analytics-service (clients/analytics-api)
      await ctx.reply('Команда /top скоро заработает: ждём данные от analytics-service.');
    });
  }
}
 