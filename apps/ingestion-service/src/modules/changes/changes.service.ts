import { Injectable } from '@nestjs/common';
import { ChangesRepository } from './changes.repository';

/** Бизнес-логика темы "changes". */
@Injectable()
export class ChangesService {
  constructor(private readonly repository: ChangesRepository) {}
}
