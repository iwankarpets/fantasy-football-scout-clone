import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsSelect, MoreThanOrEqual, Repository } from 'typeorm';
import { Player } from '../../database/entities/player.entity';
import { Team } from '../../database/entities/team.entity';
import { Gameweek } from '../../database/entities/gameweek.entity';
import { Fixture } from '../../database/entities/fixture.entity';
import { PlayerGameweekStats } from '../../database/entities/player-gameweek-stats.entity';
import { PlayerSnapshot } from '../../database/entities/player-snapshot.entity';
import { ElementType } from '../../database/entities/element-type.entity';

// raw (jsonb) не отдаём: Analytics нужны только поля для расчётов
const PLAYER_SELECT: FindOptionsSelect<Player> = {
  id: true,
  code: true,
  team: true,
  element_type: true,
  first_name: true,
  second_name: true,
  web_name: true,
  now_cost: true,
  status: true,
  chance_of_playing_next_round: true,
  news: true,
  news_added: true,
  selected_by_percent: true,
  form: true,
  points_per_game: true,
  total_points: true,
  minutes: true,
  starts: true,
  goals_scored: true,
  assists: true,
  clean_sheets: true,
  bps: true,
  expected_goals: true,
  expected_assists: true,
  ict_index: true,
  defensive_contribution: true,
  ep_next: true,
  ep_this: true,
  cost_change_event: true,
  cost_change_start: true,
  transfers_in_event: true,
  transfers_out_event: true,
};

const TEAM_SELECT: FindOptionsSelect<Team> = {
  id: true,
  code: true,
  name: true,
  short_name: true,
  strength_overall_home: true,
  strength_overall_away: true,
  strength_attack_home: true,
  strength_attack_away: true,
  strength_defence_home: true,
  strength_defence_away: true,
  played: true,
  win: true,
  draw: true,
  loss: true,
  points: true,
  position: true,
  form: true,
  strength: true,
};

const GAMEWEEK_SELECT: FindOptionsSelect<Gameweek> = {
  id: true,
  name: true,
  deadline_time: true,
  deadline_time_epoch: true,
  finished: true,
  data_checked: true,
  is_previous: true,
  is_current: true,
  is_next: true,
  release_time: true,
  average_entry_score: true,
  highest_score: true,
  top_element: true,
  most_selected: true,
  most_transferred_in: true,
  most_captained: true,
  most_vice_captained: true,
};

const ELEMENT_TYPE_SELECT: FindOptionsSelect<ElementType> = {
  id: true,
  singular_name: true,
  singular_name_short: true,
  plural_name: true,
  plural_name_short: true,
  squad_select: true,
  squad_min_play: true,
  squad_max_play: true,
  element_count: true,
};

/** Только чтение, для внутренней выдачи данных другим сервисам. */
@Injectable()
export class InternalReadRepository {
  constructor(
    @InjectRepository(Player) private readonly players: Repository<Player>,
    @InjectRepository(Team) private readonly teams: Repository<Team>,
    @InjectRepository(Gameweek) private readonly gameweeks: Repository<Gameweek>,
    @InjectRepository(Fixture) private readonly fixtures: Repository<Fixture>,
    @InjectRepository(PlayerGameweekStats)
    private readonly stats: Repository<PlayerGameweekStats>,
    @InjectRepository(PlayerSnapshot) private readonly snapshots: Repository<PlayerSnapshot>,
    @InjectRepository(ElementType) private readonly elementTypes: Repository<ElementType>,
  ) {}

  findPlayers(): Promise<Player[]> {
    return this.players.find({ select: PLAYER_SELECT, order: { id: 'ASC' } });
  }

  findTeams(): Promise<Team[]> {
    return this.teams.find({ select: TEAM_SELECT, order: { id: 'ASC' } });
  }

  findGameweeks(): Promise<Gameweek[]> {
    return this.gameweeks.find({ select: GAMEWEEK_SELECT, order: { id: 'ASC' } });
  }

  findFixtures(): Promise<Fixture[]> {
    return this.fixtures.find({ order: { id: 'ASC' } });
  }

  findStats(roundFrom: number, roundTo: number): Promise<PlayerGameweekStats[]> {
    return this.stats.find({
      where: { round: Between(roundFrom, roundTo) },
      order: { round: 'ASC', id: 'ASC' },
    });
  }

  findSnapshotsSince(since: Date): Promise<PlayerSnapshot[]> {
    return this.snapshots.find({
      where: { captured_at: MoreThanOrEqual(since) },
      order: { player_id: 'ASC', captured_at: 'ASC' },
    });
  }

  findElementTypes(): Promise<ElementType[]> {
    return this.elementTypes.find({ select: ELEMENT_TYPE_SELECT, order: { id: 'ASC' } });
  }
}
