import { Column, Entity, PrimaryColumn } from 'typeorm';
import { numericTransformer } from '../transformers';

@Entity('players')
export class Player {
  @PrimaryColumn({ type: 'int' }) id!: number;
  @Column({ type: 'int' }) code!: number;
  @Column({ type: 'int' }) team!: number;
  @Column({ type: 'int' }) element_type!: number;
  @Column({ type: 'varchar', length: 100 }) first_name!: string;
  @Column({ type: 'varchar', length: 100 }) second_name!: string;
  @Column({ type: 'varchar', length: 100 }) web_name!: string;

  /** В десятых: 61 = 6.1 */
  @Column({ type: 'int' }) now_cost!: number;
  /** a / d / i / s / u */
  @Column({ type: 'varchar', length: 1 }) status!: string;
  @Column({ type: 'int', nullable: true }) chance_of_playing_next_round!: number | null;
  @Column({ type: 'text', default: '' }) news!: string;
  @Column({ type: 'timestamptz', nullable: true }) news_added!: Date | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, transformer: numericTransformer })
  selected_by_percent!: number;
  @Column({ type: 'numeric', precision: 4, scale: 1, transformer: numericTransformer })
  form!: number;
  @Column({ type: 'numeric', precision: 4, scale: 1, transformer: numericTransformer })
  points_per_game!: number;

  @Column({ type: 'int' }) total_points!: number;
  @Column({ type: 'int' }) minutes!: number;
  @Column({ type: 'int' }) starts!: number;
  @Column({ type: 'int' }) goals_scored!: number;
  @Column({ type: 'int' }) assists!: number;
  @Column({ type: 'int' }) clean_sheets!: number;
  @Column({ type: 'int' }) bps!: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, transformer: numericTransformer })
  expected_goals!: number;
  @Column({ type: 'numeric', precision: 6, scale: 2, transformer: numericTransformer })
  expected_assists!: number;
  @Column({ type: 'numeric', precision: 7, scale: 1, transformer: numericTransformer })
  ict_index!: number;
  @Column({ type: 'int' }) defensive_contribution!: number;

  @Column({ type: 'numeric', precision: 5, scale: 1, nullable: true, transformer: numericTransformer })
  ep_next!: number | null;
  @Column({ type: 'numeric', precision: 5, scale: 1, nullable: true, transformer: numericTransformer })
  ep_this!: number | null;

  @Column({ type: 'int' }) cost_change_event!: number;
  @Column({ type: 'int' }) cost_change_start!: number;
  @Column({ type: 'int' }) transfers_in_event!: number;
  @Column({ type: 'int' }) transfers_out_event!: number;

  @Column({ type: 'jsonb' }) raw!: object;
  @Column({ type: 'timestamptz', default: () => 'now()' }) updated_at!: Date;
}
