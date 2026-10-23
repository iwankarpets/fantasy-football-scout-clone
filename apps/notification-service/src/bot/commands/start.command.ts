import { Injectable } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotCommand } from './bot-command.interface';

@Injectable()
export class StartCommand implements BotCommand {
  readonly name = 'start';
  readonly description = 'Начать работу';
  readonly inMenu = false; // /start Telegram показывает сам

  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      // telegram_id: по нему позже будем искать или создавать пользователя в user-service
      console.log(`/start от telegram_id=${ctx.from?.id}`);

      await ctx.reply(
        'Привет! Я Fantasy Scout, помогаю разбирать туры Fantasy Premier League.\n\n' +
          'Список команд: /help',
      );
    });
  }
}