import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../transformers';

@Entity('player_snapshots')
export class PlayerSnapshot {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' }) id!: number;

  /** = players.id */
  @Column({ type: 'int' }) player_id!: number;
  @Column({ type: 'timestamptz', default: () => 'now()' }) captured_at!: Date;

  /** В десятых: 61 = 6.1 */
  @Column({ type: 'int' }) now_cost!: number;
  /** a / d / i / s / u */
  @Column({ type: 'varchar', length: 1 }) status!: string;
  @Column({ type: 'int', nullable: true }) chance_of_playing_next_round!: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, transformer: numericTransformer })
  selected_by_percent!: number;
}