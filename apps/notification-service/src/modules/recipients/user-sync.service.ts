import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ParsedEvent } from '@app/messaging';
import { WatchRefsRepository } from '../watch-refs/watch-refs.repository';
import { RecipientsRepository } from './recipients.repository';
import { USER_CREATED, USER_SETTINGS_CHANGED, USER_WATCHLIST_CHANGED } from '@app/contracts';

@Injectable()
export class UserSyncService {
  private readonly logger = new Logger(UserSyncService.name);

  constructor(
    private readonly recipients: RecipientsRepository,
    private readonly watchRefs: WatchRefsRepository,
  ) {}

  async apply(event: ParsedEvent, manager: EntityManager): Promise<void> {
    switch (event.type) {
      case USER_CREATED: {
        const data = event.data;
        await this.recipients.upsert(
          {
            user_id: data.user_id,
            // допущение: для личных чатов chat_id равен telegram_id
            telegram_chat_id: data.telegram_id,
            timezone: data.timezone,
            language: data.language,
            ...data.settings,
          },
          manager,
        );
        break;
      }
      case USER_SETTINGS_CHANGED: {
        const { user_id, ...rest } = event.data;
        const updated = await this.recipients.updateSettings({ user_id, ...rest }, manager);
        if (updated === 0) {
          this.logger.warn(`settings_changed for unknown recipient ${user_id}`);
        }
        break;
      }
      case USER_WATCHLIST_CHANGED: {
        const { user_id, player_id, action } = event.data;
        if (action === 'added') {
          await this.watchRefs.add(user_id, player_id, manager);
        } else {
          await this.watchRefs.remove(user_id, player_id, manager);
        }
        break;
      }
      default:
        break;
    }
  }
}
