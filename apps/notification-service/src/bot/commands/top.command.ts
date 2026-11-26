import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { BotCommand } from './bot-command.interface';
import {
  AnalyticsApiClient,
  AnalyticsUnavailableError,
} from '../../clients/analytics-api/analytics-api.client';
import { formatTop } from '../formatters/top.formatter';
import { escapeHtml } from '../formatters/text';
import { FAILED_TEXT, UNAVAILABLE_TEXT } from './messages';
import { parseTopArgs, TOP_USAGE } from './top.args';

@Injectable()
export class TopCommand implements BotCommand {
  readonly name = 'top';
  readonly description = 'Топ игроков: /top [метрика] [позиция] [число]';
  readonly inMenu = true;

  private readonly logger = new Logger(TopCommand.name);

  constructor(private readonly analytics: AnalyticsApiClient) {}

  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      const args = parseTopArgs(ctx.match);
      if (!args.ok) {
        await ctx.reply(`${escapeHtml(args.problem)}\n\n${escapeHtml(TOP_USAGE)}`, {
          parse_mode: 'HTML',
        });
        return;
      }

      try {
        const res = await this.analytics.top({
          metric: args.metric,
          position: args.position,
          limit: args.limit,
        });
        await ctx.reply(formatTop(res), { parse_mode: 'HTML' });
      } catch (e) {
        this.logger.error(`/top failed: ${(e as Error).message}`);
        await ctx.reply(e instanceof AnalyticsUnavailableError ? UNAVAILABLE_TEXT : FAILED_TEXT);
      }
    });
  }
}
