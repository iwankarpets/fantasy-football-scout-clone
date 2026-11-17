import { Injectable, Logger } from '@nestjs/common';
import { Bot, Context, GrammyError } from 'grammy';
import type { User } from 'grammy/types';
import { BotCommand } from './bot-command.interface';
import {
  SettingsView,
  UpdateSettingsInput,
  UserApiClient,
} from '../../clients/user-api/user-api.client';
import {
  QUIET_PRESETS,
  REMINDER_OPTIONS,
  TOGGLE_FIELDS,
  renderSettings,
} from '../formatters/settings.formatter';

const UNAVAILABLE = 'The service is temporarily unavailable, please try again later.';

@Injectable()
export class SettingsCommand implements BotCommand {
  readonly name = 'settings';
  readonly description = 'Notification settings';
  readonly inMenu = true;

  private readonly logger = new Logger(SettingsCommand.name);

  constructor(private readonly userApi: UserApiClient) {}

  register(bot: Bot) {
    bot.command(this.name, async (ctx) => {
      const from = ctx.from;
      if (!from) {
        return;
      }

      try {
        const userId = await this.resolveUserId(from);
        const settings = await this.userApi.getSettings(userId);
        const view = renderSettings(settings);
        await ctx.reply(view.text, { reply_markup: view.keyboard });
      } catch (e) {
        this.logger.error(`/settings failed for telegram_id=${from.id}: ${(e as Error).message}`);
        await ctx.reply(UNAVAILABLE);
      }
    });

    // callback data: s:<kind>:<value>, где kind = t (переключатель), r (напоминание), q (тихие часы)
    bot.callbackQuery(/^s:(t|r|q):(\w+)$/, async (ctx) => {
      const from = ctx.from;
      const [, kind, value] = ctx.match as RegExpMatchArray;

      try {
        const userId = await this.resolveUserId(from);
        const current = await this.userApi.getSettings(userId);
        const patch = this.buildPatch(current, kind, value);

        if (!patch) {
          await ctx.answerCallbackQuery();
          return;
        }

        const updated = await this.userApi.updateSettings(userId, patch);
        const view = renderSettings(updated);
        await this.editMessage(ctx, view.text, view.keyboard);
        await ctx.answerCallbackQuery();
      } catch (e) {
        this.logger.error(
          `settings callback failed for telegram_id=${from.id}: ${(e as Error).message}`,
        );
        await ctx.answerCallbackQuery({ text: UNAVAILABLE, show_alert: true });
      }
    });
  }

  /** user_id берём из user-service по telegram_id из сообщения; вручную его никто не вводит. */
  private async resolveUserId(from: User): Promise<string> {
    const { user } = await this.userApi.start({
      telegram_id: from.id,
      username: from.username ?? null,
      language: from.language_code ?? null,
    });
    return user.id;
  }

  private buildPatch(
    current: SettingsView,
    kind: string,
    value: string,
  ): UpdateSettingsInput | null {
    if (kind === 't') {
      const field = TOGGLE_FIELDS[value as keyof typeof TOGGLE_FIELDS];
      return field ? { [field]: !current[field] } : null;
    }

    if (kind === 'r') {
      const hours = Number(value);
      if (!(REMINDER_OPTIONS as readonly number[]).includes(hours)) {
        return null;
      }
      const next = new Set(current.deadline_reminder_hours);
      if (!next.delete(hours)) {
        next.add(hours);
      }
      return { deadline_reminder_hours: [...next] };
    }

    if (kind === 'q') {
      const preset = QUIET_PRESETS[value];
      // quiet_from и quiet_to всегда меняются вместе: user-service отклонит одно без другого
      return preset ? { quiet_from: preset.from, quiet_to: preset.to } : null;
    }

    return null;
  }

  private async editMessage(
    ctx: Context,
    text: string,
    keyboard: ReturnType<typeof renderSettings>['keyboard'],
  ) {
    try {
      await ctx.editMessageText(text, { reply_markup: keyboard });
    } catch (e) {
      // Telegram возвращает 400, если текст и кнопки не изменились (например, повторное нажатие)
      if (e instanceof GrammyError && e.description.includes('message is not modified')) {
        return;
      }
      throw e;
    }
  }
}
