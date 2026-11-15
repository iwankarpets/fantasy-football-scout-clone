import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotCommand } from './bot-command.interface';
import { UserApiClient } from '../../clients/user-api/user-api.client';

@Injectable()
export class StartCommand implements BotCommand {
  readonly name = 'start';
  readonly description = 'Start the bot';
  readonly inMenu = false;

  private readonly logger = new Logger(StartCommand.name);

  constructor(private readonly userApi: UserApiClient) {}

  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      const from = ctx.from;
      if (!from) {
        return;
      }

      try {
        const { created } = await this.userApi.start({
          telegram_id: from.id,
          username: from.username ?? null,
          language: from.language_code ?? null,
        });

        const greeting = created ? 'Hi!' : 'Welcome back!';
        await ctx.reply(
          `${greeting} I am Fantasy Scout, helping you analyze Fantasy Premier League gameweeks.\n\n` +
            'List of commands: /help',
        );
      } catch (e) {
        this.logger.error(`/start failed for telegram_id=${from.id}: ${(e as Error).message}`);
        await ctx.reply('The service is temporarily unavailable, please try again later.');
      }
    });
  }
}
