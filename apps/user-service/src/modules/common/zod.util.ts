import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function parseWith<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const res = schema.safeParse(value);
  if (!res.success) {
    throw new BadRequestException(z.prettifyError(res.error));
  }
  return res.data;
}
