import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fixture } from '../../database/entities/fixture.entity';
import { FixturesRepository } from './fixture.repository';
import { FixturesService } from './fixtures.service';

@Module({
  imports: [TypeOrmModule.forFeature([Fixture])],
  providers: [FixturesRepository, FixturesService],
  exports: [FixturesService],
})
export class FixturesModule {}