import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context, MiddlewareFn } from 'grammy';
import Redis from 'ioredis';
import { REDIS } from '../../redis/redis.module';

const LIMIT_MESSAGE = 'Too many requests, please slow down.';

/**
 * Лимит команд и нажатий кнопок на пользователя: фиксированное окно в Redis.
 * Обычные текстовые сообщения (не команды) не считаются.
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly windowSeconds: number;
  private readonly maxCommands: number;

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.windowSeconds = config.getOrThrow<number>('rateLimit.windowSeconds');
    this.maxCommands = config.getOrThrow<number>('rateLimit.maxCommands');
  }

  /** Подключается один раз: bot.use(rateLimit.middleware()) до регистрации команд. */
  middleware(): MiddlewareFn<Context> {
    return async (ctx, next) => {
      const from = ctx.from;
      const isCommand = ctx.message?.text?.startsWith('/') ?? false;
      const isCallback = ctx.callbackQuery !== undefined;

      if (!from || !(isCommand || isCallback)) {
        return next();
      }

      const count = await this.hit(from.id);
      // Redis недоступен (null) или лимит не превышен: пропускаем
      if (count === null || count <= this.maxCommands) {
        return next();
      }

      // Предупреждаем один раз за окно, дальше молча игнорируем, чтобы не отвечать спамеру
      const firstOverLimit = count === this.maxCommands + 1;
      if (isCallback) {
        // Callback нужно обязательно подтвердить, иначе у кнопки крутится индикатор
        await ctx.answerCallbackQuery(firstOverLimit ? { text: LIMIT_MESSAGE } : undefined);
      } else if (firstOverLimit) {
        await ctx.reply(LIMIT_MESSAGE);
      }
    };
  }

  /** Число обращений в текущем окне или null, если Redis недоступен (fail-open). */
  private async hit(telegramId: number): Promise<number | null> {
    const key = `rl:cmd:${telegramId}`;
    try {
      // SET NX EX и INCR в одной транзакции: ключ не останется без срока жизни
      const results = await this.redis
        .multi()
        .set(key, 0, 'EX', this.windowSeconds, 'NX')
        .incr(key)
        .exec();
      const [error, value] = results?.[1] ?? [new Error('empty redis reply'), null];
      if (error) {
        throw error;
      }
      return Number(value);
    } catch (e) {
      this.logger.warn(`rate limit skipped, redis unavailable: ${(e as Error).message}`);
      return null;
    }
  }
}
