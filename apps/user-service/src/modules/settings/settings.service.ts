import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { UserSettingsChangedV1 } from '@app/contracts';
import { OutboxService } from '../../events/outbox/outbox.service';
import { SettingsRepository } from './settings.repository';
import { SettingsData, toSettingsData } from './settings.types';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'expected HH:MM');

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const updateSettingsSchema = z
  .object({
    deadline_reminder_hours: z
      .array(z.number().int().min(1).max(168))
      .max(5)
      .transform((a) => [...new Set(a)].sort((x, y) => y - x)),
    notify_report: z.boolean(),
    notify_injuries: z.boolean(),
    notify_price: z.boolean(),
    quiet_from: hhmm.nullable(),
    quiet_to: hhmm.nullable(),
    // timezone и language хранятся в users, но меняются вместе с настройками
    timezone: z.string().refine(isValidTimezone, 'unknown timezone'),
    language: z.string().min(2).max(5),
  })
  .partial()
  .strict();

export type UpdateSettings = z.output<typeof updateSettingsSchema>;
export type SettingsView = SettingsData & { timezone: string; language: string };

@Injectable()
export class SettingsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly repository: SettingsRepository,
    private readonly outbox: OutboxService,
  ) {}

  async get(userId: string): Promise<SettingsView> {
    const profile = await this.repository.findProfile(userId);
    const settings = await this.repository.find(userId);
    if (!profile || !settings) {
      throw new NotFoundException('User not found');
    }
    return {
      ...toSettingsData(settings),
      timezone: profile.timezone,
      language: profile.language,
    };
  }

  /** Меняет настройки и пишет user.settings_changed со всеми текущими значениями (одна транзакция). */
  async update(userId: string, patch: UpdateSettings): Promise<SettingsView> {
    const { timezone, language, ...settingsPatch } = patch;

    return this.dataSource.transaction(async (manager) => {
      const profile = await this.repository.findProfileForUpdate(userId, manager);
      if (!profile) {
        throw new NotFoundException('User not found');
      }

      await this.repository.updateProfile(userId, { timezone, language }, manager);

      const settings = await this.repository.patch(userId, settingsPatch, manager);
      if (!settings) {
        throw new NotFoundException('Settings not found');
      }
      // Исключение откатит всю транзакцию, включая обновление users
      if ((settings.quiet_from === null) !== (settings.quiet_to === null)) {
        throw new BadRequestException('quiet_from and quiet_to must be set together');
      }

      const result: SettingsView = {
        ...toSettingsData(settings),
        timezone: timezone ?? profile.timezone,
        language: language ?? profile.language,
      };
      await this.outbox.add(UserSettingsChangedV1, { user_id: userId, ...result }, manager, {
        correlationId: randomUUID(),
      });
      return result;
    });
  }
}
