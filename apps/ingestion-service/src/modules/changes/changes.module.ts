import { Module } from '@nestjs/common';
import { ChangesRepository } from './changes.repository';
import { ChangesService } from './changes.service';

@Module({
  providers: [ChangesRepository, ChangesService],
  exports: [ChangesService],
})
export class ChangesModule {}
