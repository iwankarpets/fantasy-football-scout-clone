import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { UserCreatedV1 } from '@app/contracts';
import { OutboxService } from '../../events/outbox/outbox.service';
import { SettingsRepository } from '../settings/settings.repository';
import { toSettingsData } from '../settings/settings.types';
import { UsersRepository } from './users.repository';

export const startUserSchema = z.object({
  telegram_id: z.number().int().positive(),
  username: z.string().max(64).nullish(),
  /** language_code из Telegram, например 'ru' или 'en-US' */
  language: z.string().min(2).max(35).nullish(),
});
export type StartUser = z.output<typeof startUserSchema>;

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: UsersRepository,
    private readonly settings: SettingsRepository,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * /start: находит или создаёт пользователя. Для нового в одной транзакции
   * создаются настройки по умолчанию и событие user.created.
   */
  async start(input: StartUser) {
    return this.dataSource.transaction(async (manager) => {
      const { user, created } = await this.repository.upsertByTelegramId(
        input.telegram_id,
        input.username ?? null,
        input.language ? input.language.slice(0, 2).toLowerCase() : null,
        manager,
      );

      if (!created) {
        const settings = await this.settings.find(user.id, manager);
        return { user, settings, created };
      }

      const settings = await this.settings.insertDefaults(user.id, manager);
      await this.outbox.add(
        UserCreatedV1,
        {
          user_id: user.id,
          telegram_id: user.telegram_id,
          timezone: user.timezone,
          language: user.language,
          settings: toSettingsData(settings),
        },
        manager,
        { correlationId: randomUUID() },
      );
      return { user, settings, created };
    });
  }

  async getById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
