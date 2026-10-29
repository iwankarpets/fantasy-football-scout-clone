import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { numericTransformer } from '../transformers';

@Entity('player_gameweek_stats')
@Unique('player_gw_stats_element_fixture_uq', ['element', 'fixture'])
@Index('idx_pgs_element_round', ['element', 'round'])
@Index('idx_pgs_round', ['round'])
export class PlayerGameweekStats {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' }) id!: number;

  /** = players.id */
  @Column({ type: 'int' }) element!: number;
  /** = fixtures.id; уникальность по матчу, а не по туру (спаренные туры) */
  @Column({ type: 'int' }) fixture!: number;
  /** номер тура = gameweeks.id */
  @Column({ type: 'int' }) round!: number;
  /** = teams.id */
  @Column({ type: 'int' }) opponent_team!: number;
  @Column({ type: 'boolean' }) was_home!: boolean;

  @Column({ type: 'int', default: 0 }) minutes!: number;
  @Column({ type: 'int', default: 0 }) starts!: number;
  @Column({ type: 'int', default: 0 }) goals_scored!: number;
  @Column({ type: 'int', default: 0 }) assists!: number;
  @Column({ type: 'int', default: 0 }) clean_sheets!: number;
  @Column({ type: 'int', default: 0 }) goals_conceded!: number;
  @Column({ type: 'int', default: 0 }) saves!: number;
  @Column({ type: 'int', default: 0 }) bonus!: number;
  @Column({ type: 'int', default: 0 }) bps!: number;
  @Column({ type: 'int', default: 0 }) yellow_cards!: number;
  @Column({ type: 'int', default: 0 }) red_cards!: number;
  @Column({ type: 'int', default: 0 }) total_points!: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0, transformer: numericTransformer })
  expected_goals!: number;
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0, transformer: numericTransformer })
  expected_assists!: number;
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0, transformer: numericTransformer })
  expected_goal_involvements!: number;
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0, transformer: numericTransformer })
  expected_goals_conceded!: number;

  /** цена на момент тура, в десятых: 60 = 6.0 */
  @Column({ type: 'int' }) value!: number;
  @Column({ type: 'int', default: 0 }) selected!: number;
  @Column({ type: 'int', default: 0 }) transfers_in!: number;
  @Column({ type: 'int', default: 0 }) transfers_out!: number;
  @Column({ type: 'int', default: 0 }) transfers_balance!: number;

  @Column({ type: 'timestamptz', default: () => 'now()' }) updated_at!: Date;
}