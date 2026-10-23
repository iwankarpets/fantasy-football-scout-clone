import { Injectable } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotCommand } from './bot-command.interface';

@Injectable()
export class SettingsCommand implements BotCommand {
  readonly name = 'settings';
  readonly description = 'Настройки уведомлений';
  readonly inMenu = true;

  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      // TODO: настройки из user-service (напоминания о дедлайне, травмы, цены, тихие часы)
      await ctx.reply('Настройки скоро заработают.');
    });
  }
}