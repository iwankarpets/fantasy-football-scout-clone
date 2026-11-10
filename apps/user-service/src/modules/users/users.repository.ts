import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

type RawUser = Omit<User, 'telegram_id'> & { telegram_id: string; inserted: boolean };

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  /** Создаёт пользователя или обновляет last_seen_at. created = true только у новой строки. */
  async upsertByTelegramId(
    telegramId: number,
    username: string | null,
    language: string | null,
    manager: EntityManager,
  ): Promise<{ user: User; created: boolean }> {
    const rows: RawUser[] = await manager.query(
      `INSERT INTO users (telegram_id, username, language)
       VALUES ($1, $2, COALESCE($3::varchar, 'ru'))
       ON CONFLICT (telegram_id) DO UPDATE
         SET last_seen_at = now(),
             username     = COALESCE(EXCLUDED.username, users.username),
             is_active    = true
       RETURNING *, (xmax = 0) AS inserted`,
      [telegramId, username, language],
    );
    // Сырой запрос не проходит через entity, поэтому bigint приводим к number вручную
    const { inserted, telegram_id, ...rest } = rows[0];
    return { user: { ...rest, telegram_id: Number(telegram_id) }, created: inserted };
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }
}
