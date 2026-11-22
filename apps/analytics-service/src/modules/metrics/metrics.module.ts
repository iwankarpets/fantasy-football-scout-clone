import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsController } from './metrics.controller';
import { MetricsRepository } from './metrics.repository';
import { MetricsService } from './metrics.service';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';

@Module({
  imports: [ConfigModule],
  controllers: [MetricsController],
  providers: [InternalApiKeyGuard, MetricsRepository, MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
