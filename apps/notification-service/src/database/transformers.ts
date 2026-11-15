import { ValueTransformer } from 'typeorm';

/** bigint приходит из Postgres строкой. Telegram ID умещается в Number без потери точности. */
export const bigintToNumber: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null ? value : Number(value)),
};
