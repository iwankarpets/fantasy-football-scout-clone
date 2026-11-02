import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { AdminController } from './admin.controller';
import { InternalApiKeyGuard } from './internal-key.guard';
import { SchedulerModule } from '../scheduler/scheduler.module';

/** Ручной запуск синхронизации. Доступен только по служебному ключу. */
@Module({
  imports: [JobsModule, SchedulerModule],
  controllers: [AdminController],
  providers: [InternalApiKeyGuard],
})
export class AdminModule {}
