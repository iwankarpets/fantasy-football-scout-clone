import { z } from 'zod';
import { defineEvent } from '../envelope';
import { notificationSettingsSchema } from './user-settings.shared';

export const UserCreatedV1 = defineEvent(
  'user.created',
  1,
  z.object({
    user_id: z.uuid(),
    telegram_id: z.number().int().positive(),
    timezone: z.string().min(1),
    language: z.string().min(2).max(5),
    settings: notificationSettingsSchema,
  }),
);
