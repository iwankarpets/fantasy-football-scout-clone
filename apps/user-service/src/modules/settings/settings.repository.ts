import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NotificationSettings } from '../../database/entities/notification-settings.entity';
import { User } from '../../database/entities/user.entity';
import { SettingsData } from './settings.types';

export interface UserProfile {
  timezone: string;
  language: string;
}

@Injectable()
export class SettingsRepository {
  constructor(
    @InjectRepository(NotificationSettings)
    private readonly repo: Repository<NotificationSettings>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /** Создаёт строку; остальные значения подставляет база (default в миграции). */
  async insertDefaults(userId: string, manager: EntityManager): Promise<NotificationSettings> {
    const repo = manager.getRepository(NotificationSettings);
    await repo.insert({ user_id: userId });
    return repo.findOneByOrFail({ user_id: userId });
  }

  find(userId: string, manager?: EntityManager): Promise<NotificationSettings | null> {
    const repo = manager ? manager.getRepository(NotificationSettings) : this.repo;
    return repo.findOneBy({ user_id: userId });
  }

  /** Обновляет только переданные поля (undefined пропускается, null записывается). */
  async patch(
    userId: string,
    patch: Partial<SettingsData>,
    manager: EntityManager,
  ): Promise<NotificationSettings | null> {
    const repo = manager.getRepository(NotificationSettings);
    const res = await repo.update({ user_id: userId }, { ...patch, updated_at: new Date() });
    if (!res.affected) {
      return null;
    }
    return repo.findOneBy({ user_id: userId });
  }

  findProfile(userId: string): Promise<UserProfile | null> {
    return this.users.findOne({
      where: { id: userId },
      select: { id: true, timezone: true, language: true },
    });
  }

  /** С блокировкой строки: параллельные изменения одного пользователя идут по очереди. */
  findProfileForUpdate(userId: string, manager: EntityManager): Promise<UserProfile | null> {
    return manager.getRepository(User).findOne({
      where: { id: userId },
      select: { id: true, timezone: true, language: true },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async updateProfile(
    userId: string,
    patch: { timezone?: string; language?: string },
    manager: EntityManager,
  ): Promise<void> {
    if (patch.timezone === undefined && patch.language === undefined) {
      return;
    }
    await manager.getRepository(User).update({ id: userId }, patch);
  }
}
