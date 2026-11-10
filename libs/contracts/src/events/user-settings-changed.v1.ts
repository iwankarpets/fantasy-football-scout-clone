import { z } from 'zod';
import { defineEvent } from '../envelope';
import { notificationSettingsSchema } from './user-settings.shared';

/** Все текущие значения целиком: получатель просто перезаписывает свою копию. */
export const UserSettingsChangedV1 = defineEvent(
  'user.settings_changed',
  1,
  notificationSettingsSchema.extend({
    user_id: z.uuid(),
    timezone: z.string().min(1),
    language: z.string().min(2).max(5),
  }),
);
