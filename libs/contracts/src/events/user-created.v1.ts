import { z } from 'zod';
import { defineEvent } from '../envelope';
import { notificationSettingsSchema } from './user-settings.shared';
import { USER_CREATED } from './events';

export const UserCreatedV1 = defineEvent(
  USER_CREATED,
  1,
  z.object({
    user_id: z.uuid(),
    telegram_id: z.number().int().positive(),
    timezone: z.string().min(1),
    language: z.string().min(2).max(5),
    settings: notificationSettingsSchema,
  }),
);
