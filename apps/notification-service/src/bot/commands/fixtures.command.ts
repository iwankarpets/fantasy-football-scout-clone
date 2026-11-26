import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotCommand } from './bot-command.interface';
import {
  AnalyticsApiClient,
  AnalyticsUnavailableError,
} from '../../clients/analytics-api/analytics-api.client';
import { formatFixtures } from '../formatters/fixtures.formatter';
import { FAILED_TEXT, UNAVAILABLE_TEXT } from './messages';

export const FIXTURES_USAGE = 'Использование: /fixtures [3|5]. По умолчанию 3 тура.';

@Injectable()
export class FixturesCommand implements BotCommand {
  readonly name = 'fixtures';
  readonly description = 'Календарь сложности: /fixtures [3|5]';
  readonly inMenu = true;

  private readonly logger = new Logger(FixturesCommand.name);

  constructor(private readonly analytics: AnalyticsApiClient) {}

  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      const arg = ctx.match.trim();
      if (arg !== '' && arg !== '3' && arg !== '5') {
        await ctx.reply(FIXTURES_USAGE);
        return;
      }

      try {
        const items = await this.analytics.fixtureDifficulty(arg ? Number(arg) : 3);
        await ctx.reply(formatFixtures(items), { parse_mode: 'HTML' });
      } catch (e) {
        this.logger.error(`/fixtures failed: ${(e as Error).message}`);
        await ctx.reply(e instanceof AnalyticsUnavailableError ? UNAVAILABLE_TEXT : FAILED_TEXT);
      }
    });
  }
}
