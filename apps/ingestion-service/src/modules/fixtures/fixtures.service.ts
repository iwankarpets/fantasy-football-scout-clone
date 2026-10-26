import { Injectable } from '@nestjs/common';
import { FixturesRepository } from './fixtures.repository';

/** Бизнес-логика темы "fixtures". */
@Injectable()
export class FixturesService {
  constructor(private readonly repository: FixturesRepository) {}
}
