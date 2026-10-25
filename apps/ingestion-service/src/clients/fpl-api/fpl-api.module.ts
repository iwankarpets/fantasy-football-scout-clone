import { Module } from '@nestjs/common';
import { FplApiClient } from './fpl-api.client';

@Module({
  providers: [FplApiClient],
  exports: [FplApiClient],
})
export class FplApiModule {}