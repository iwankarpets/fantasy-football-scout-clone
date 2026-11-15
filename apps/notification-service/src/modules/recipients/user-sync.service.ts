import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ParsedEvent } from '@app/messaging';
import { WatchRefsRepository } from '../watch-refs/watch-refs.repository';
import { RecipientsRepository } from './recipients.repository';

@Injectable()
export class UserSyncService {
  private readonly logger = new Logger(UserSyncService.name);

  constructor(
    private readonly recipients: RecipientsRepository,
    private readonly watchRefs: WatchRefsRepository,
  ) {}

  async apply(event: ParsedEvent, m: EntityManager): Promise<void> {
    switch (event.type) {
      case 'user.created': {
        const d = event.data;
        await this.recipients.upsert(
          {
            user_id: d.user_id,
            // допущение: для личных чатов chat_id равен telegram_id
            telegram_chat_id: d.telegram_id,
            timezone: d.timezone,
            language: d.language,
            ...d.settings,
          },
          m,
        );
        break;
      }
      case 'user.settings_changed': {
        const { user_id, ...rest } = event.data;
        const updated = await this.recipients.updateSettings({ user_id, ...rest }, m);
        if (updated === 0) {
          this.logger.warn(`settings_changed for unknown recipient ${user_id}`);
        }
        break;
      }
      case 'user.watchlist_changed': {
        const { user_id, player_id, action } = event.data;
        if (action === 'added') {
          await this.watchRefs.add(user_id, player_id, m);
        } else {
          await this.watchRefs.remove(user_id, player_id, m);
        }
        break;
      }
      default:
        break;
    }
  }
}
