import { Module } from '@nestjs/common';
import { FixturesService } from './fixtures.service';
import { FixtureRepository } from './fixture.repository';

@Module({
  providers: [FixtureRepository, FixturesService],
  exports: [FixturesService],
})
export class FixturesModule {}
