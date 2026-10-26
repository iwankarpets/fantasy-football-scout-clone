import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { AdminController } from './admin.controller';
import { InternalApiKeyGuard } from './internal-key.guard';

/** Ручной запуск синхронизации. Доступен только по служебному ключу. */
@Module({
  imports: [JobsModule],
  controllers: [AdminController],
  providers: [InternalApiKeyGuard],
})
export class AdminModule {}
