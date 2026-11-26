import { Module } from '@nestjs/common';
import { AnalyticsApiClient } from './analytics-api.client';

@Module({
  providers: [AnalyticsApiClient],
  exports: [AnalyticsApiClient],
})
export class AnalyticsApiModule {}
