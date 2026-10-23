import { Injectable } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotCommand } from './bot-command.interface';
 
@Injectable()
export class CompareCommand implements BotCommand {
  readonly name = 'compare';
  readonly description = 'Сравнить 2–4 игроков';
  readonly inMenu = true;
 
  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      // Игроков разделяем пробелами или запятыми: /compare Salah Saka Palmer
      const names = ctx.match.split(/[\s,]+/).filter(Boolean);
 
      if (names.length < 2 || names.length > 4) {
        await ctx.reply('Укажите от 2 до 4 игроков, например:\n/compare Salah Saka Palmer');
        return;
      }
 
      // TODO: поиск игроков по web_name и запрос сравнения в analytics-service
      await ctx.reply(`Сравнение скоро заработает. Игроки: ${names.join(', ')}`);
    });
  }
}