import { Injectable } from '@nestjs/common';
import { PlayersRepository } from './players.repository';

/** Бизнес-логика темы "players". */
@Injectable()
export class PlayersService {
  constructor(private readonly repository: PlayersRepository) {}
}