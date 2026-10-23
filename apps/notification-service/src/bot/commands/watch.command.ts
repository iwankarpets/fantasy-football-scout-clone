import { Injectable } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotCommand } from './bot-command.interface';

@Injectable()
export class WatchCommand implements BotCommand {
  readonly name = 'watch';
  readonly description = 'Следить за игроком';
  readonly inMenu = true;

  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      const player = ctx.match.trim();

      if (!player) {
        await ctx.reply('Укажите игрока, например:\n/watch Salah');
        return;
      }

      // TODO: добавить в список наблюдения через user-service
      await ctx.reply(`Список наблюдения скоро заработает. Игрок: ${player}`);
    });
  }
}