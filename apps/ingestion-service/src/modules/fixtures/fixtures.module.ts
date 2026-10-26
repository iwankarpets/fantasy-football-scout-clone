import { Module } from '@nestjs/common';
import { FixturesRepository } from './fixtures.repository';
import { FixturesService } from './fixtures.service';

@Module({
  providers: [FixturesRepository, FixturesService],
  exports: [FixturesService],
})
export class FixturesModule {}
