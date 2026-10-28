import { Module } from '@nestjs/common';
import { FixturesService } from './fixtures.service';
import { FixturesRepository } from './fixture.repository';

@Module({
  providers: [FixturesRepository, FixturesService],
  exports: [FixturesService],
})
export class FixturesModule {}
