import { Module } from '@nestjs/common';

/**
 * Сюда добавятся BullMQ-очередь и процессоры:
 * sync-bootstrap, sync-fixtures, sync-player-history, daily-snapshot, deadline-check.
 */
@Module({})
export class JobsModule {}