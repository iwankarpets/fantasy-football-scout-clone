import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, GrammyError, HttpError } from 'grammy';
import { autoRetry } from '@grammyjs/auto-retry';
import { runWithCorrelationId, toUserMessage } from '@app/common';
import { BOT_COMMANDS, BotCommand } from './commands';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  readonly bot: Bot;

  constructor(
    config: ConfigService,
    @Inject(BOT_COMMANDS) private readonly commands: BotCommand[],
  ) {
    this.bot = new Bot(config.getOrThrow<string>('BOT_TOKEN'));
  }

  onModuleInit() {
    // Автоповтор при лимитах Telegram (429) и сетевых сбоях
    this.bot.api.config.use(autoRetry());

    // Каждое сообщение обрабатывается со своим correlation ID. Должно идти до команд.
    this.bot.use((ctx, next) => runWithCorrelationId(() => next()));

    // Все команды из списка COMMANDS
    for (const command of this.commands) {
      command.register(this.bot);
    }
    this.bot.command('help', (ctx) => ctx.reply(this.helpText()));

    this.bot.catch(async (err) => {
      const e = err.error;
      const updateId = err.ctx.update.update_id;

      // 403: пользователь заблокировал бота, отвечать некому
      // (позже здесь же помечаем пользователя неактивным)
      if (e instanceof GrammyError && e.error_code === 403) {
        this.logger.warn(`Пользователь заблокировал бота (update ${updateId})`);
        return;
      }

      if (e instanceof GrammyError) {
        this.logger.error(`Ошибка Telegram API (update ${updateId}): ${e.description}`, e.stack);
      } else if (e instanceof HttpError) {
        this.logger.error(`Нет связи с Telegram (update ${updateId}): ${e.message}`, e.stack);
      } else if (e instanceof Error) {
        this.logger.error(`Ошибка в обработчике (update ${updateId}): ${e.message}`, e.stack);
      } else {
        this.logger.error(`Неизвестная ошибка (update ${updateId}): ${String(e)}`);
      }

      // Пользователь всегда получает понятный ответ, а не тишину
      try {
        await err.ctx.reply(toUserMessage(e));
      } catch {
        this.logger.warn(`Не удалось отправить сообщение об ошибке (update ${updateId})`);
      }
    });

    // start() работает бесконечно, поэтому без await
    this.bot
      .start({
        onStart: (me) => {
          this.logger.log(`Бот запущен: @${me.username}`);
          void this.publishMenu();
        },
      })
      .catch((e) => {
        this.logger.error(
          `Не удалось запустить бота: ${e instanceof Error ? e.message : String(e)}`,
          e instanceof Error ? e.stack : undefined,
        );
      });
  }

  async onModuleDestroy() {
    await this.bot.stop();
  }

  /** Список команд в меню Telegram (кнопка «Меню» рядом с полем ввода) */
  private async publishMenu() {
    const menu = this.commands
      .filter((c) => c.inMenu)
      .map((c) => ({ command: c.name, description: c.description }));
    menu.push({ command: 'help', description: 'Список команд' });

    try {
      await this.bot.api.setMyCommands(menu);
      this.logger.log(`Меню команд обновлено (${menu.length})`);
    } catch (e) {
      this.logger.warn(`Не удалось обновить меню команд: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private helpText(): string {
    const lines = this.commands
      .filter((c) => c.inMenu)
      .map((c) => `/${c.name} — ${c.description}`);
    return ['Команды:', ...lines, '/help — Список команд'].join('\n');
  }
}