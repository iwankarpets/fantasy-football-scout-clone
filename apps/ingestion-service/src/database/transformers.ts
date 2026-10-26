import { ValueTransformer } from 'typeorm';

/** pg отдаёт numeric и bigint строками; в коде работаем с number. */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? null : Number(value)),
};
