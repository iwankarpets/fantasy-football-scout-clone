import { Injectable } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotCommand } from './bot-command.interface';

@Injectable()
export class ReportCommand implements BotCommand {
  readonly name = 'report';
  readonly description = 'Разбор ближайшего тура';
  readonly inMenu = true;

  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      // TODO: последний gameweek_report из analytics-service
      await ctx.reply('Разбор тура скоро заработает.');
    });
  }
}