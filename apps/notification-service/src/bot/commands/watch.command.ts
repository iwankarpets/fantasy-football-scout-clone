import { Injectable, Logger } from '@nestjs/common';
import { Bot, Context, InlineKeyboard } from 'grammy';
import { User } from 'grammy/types';
import { BotCommand } from './bot-command.interface';
import { AnalyticsApiClient } from '../../clients/analytics-api/analytics-api.client';
import { PlayerSearchItem } from '../../clients/analytics-api/analytics-api.types';
import { UserApiClient } from '../../clients/user-api/user-api.client';
import { playerLabel } from '../formatters/watch.formatter';

const SEARCH_LIMIT = 5;
const MIN_QUERY_LENGTH = 2;
const UNAVAILABLE = 'Сервис временно недоступен, попробуйте позже.';
const USAGE =
  'Чтобы следить за игроком, напиши /watch и имя, например: /watch salah или /watch салах.\n' +
  'Список наблюдения: /watch без имени.';

interface Rendered {
  text: string;
  keyboard?: InlineKeyboard;
}

@Injectable()
export class WatchCommand implements BotCommand {
  readonly name = 'watch';
  readonly description = 'Список наблюдения: /watch [имя игрока]';
  readonly inMenu = true;

  private readonly logger = new Logger(WatchCommand.name);

  constructor(
    private readonly userApi: UserApiClient,
    private readonly analytics: AnalyticsApiClient,
  ) {}

  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      if (!ctx.from) {
        return;
      }
      try {
        await this.onCommand(ctx, ctx.from, ctx.match.trim());
      } catch (e) {
        this.logger.error(`/watch failed for telegram_id=${ctx.from.id}: ${(e as Error).message}`);
        await ctx.reply(UNAVAILABLE);
      }
    });

    bot.callbackQuery(/^watch:(add|rm):(\d+)$/, async (ctx) => {
      // Кнопка не должна «крутиться» дольше необходимого
      await ctx.answerCallbackQuery().catch(() => undefined);
      if (!ctx.from) {
        return;
      }
      const [, action, id] = ctx.match;
      try {
        await this.onCallback(ctx, ctx.from, action as 'add' | 'rm', Number(id));
      } catch (e) {
        this.logger.error(
          `watch callback failed for telegram_id=${ctx.from.id}: ${(e as Error).message}`,
        );
        await ctx.reply(UNAVAILABLE);
      }
    });
  }

  private async onCommand(ctx: Context, from: User, query: string): Promise<void> {
    const userId = await this.resolveUserId(from);

    if (query === '' || query.toLowerCase() === 'list') {
      const view = await this.renderList(userId);
      await ctx.reply(view.text, { reply_markup: view.keyboard });
      return;
    }

    if (query.length < MIN_QUERY_LENGTH) {
      await ctx.reply(USAGE);
      return;
    }

    const found = await this.analytics.search(query, SEARCH_LIMIT);
    if (found.length === 0) {
      await ctx.reply(`Игрока «${query}» не нашёл. Попробуй написать фамилию иначе.`);
    } else if (found.length === 1) {
      const { changed } = await this.userApi.addToWatchlist(userId, found[0].id);
      await ctx.reply(
        `${changed ? '✅ Слежу за игроком' : 'ℹ️ Уже слежу за игроком'}: ${playerLabel(found[0])}`,
      );
    } else {
      const kb = new InlineKeyboard();
      for (const p of found) {
        kb.text(playerLabel(p), `watch:add:${p.id}`).row();
      }
      await ctx.reply('Нашёл нескольких игроков, выбери нужного:', { reply_markup: kb });
    }
  }

  private async onCallback(
    ctx: Context,
    from: User,
    action: 'add' | 'rm',
    playerId: number,
  ): Promise<void> {
    const userId = await this.resolveUserId(from);

    if (action === 'add') {
      const { changed } = await this.userApi.addToWatchlist(userId, playerId);
      const [p] = await this.analytics
        .playersByIds([playerId])
        .catch(() => [] as PlayerSearchItem[]);
      await ctx.editMessageText(
        `${changed ? '✅ Слежу за игроком' : 'ℹ️ Уже слежу за игроком'}: ${p ? playerLabel(p) : `#${playerId}`}`,
      );
      return;
    }

    await this.userApi.removeFromWatchlist(userId, playerId);
    const view = await this.renderList(userId);
    await ctx.editMessageText(view.text, { reply_markup: view.keyboard });
  }

  private async renderList(userId: string): Promise<Rendered> {
    const items = await this.userApi.getWatchlist(userId);
    if (items.length === 0) {
      return { text: `Список наблюдения пуст.\n\n${USAGE}` };
    }

    const ids = items.map((i) => i.player_id);
    // Если Analytics недоступен, список всё равно показываем, просто без имён
    const players = await this.analytics.playersByIds(ids).catch((e: Error) => {
      this.logger.warn(`names unavailable: ${e.message}`);
      return [] as PlayerSearchItem[];
    });
    const byId = new Map(players.map((p) => [p.id, p]));

    const lines: string[] = [];
    const kb = new InlineKeyboard();
    ids.forEach((id, i) => {
      const p = byId.get(id);
      lines.push(`${i + 1}. ${p ? playerLabel(p) : `Игрок #${id}`}`);
      kb.text(`✖ ${p ? p.web_name : `#${id}`}`, `watch:rm:${id}`).row();
    });

    return {
      text: `Список наблюдения (${ids.length}):\n${lines.join('\n')}\n\nНажми на кнопку, чтобы убрать игрока.`,
      keyboard: kb,
    };
  }

  private async resolveUserId(from: User): Promise<string> {
    // TODO: если для /settings у тебя уже есть такой хелпер, используй его
    const res = await this.userApi.start({
      telegram_id: from.id,
      username: from.username ?? null,
      language: from.language_code ?? null,
    });
    return res.user.id;
  }
}
