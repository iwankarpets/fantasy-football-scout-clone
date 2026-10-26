import { Column, Entity, PrimaryColumn } from 'typeorm';
import { numericTransformer } from '../transformers';

/** id = номер тура. */
@Entity('gameweeks')
export class Gameweek {
  @PrimaryColumn({ type: 'int' }) id!: number;
  @Column({ type: 'varchar', length: 50 }) name!: string;
  @Column({ type: 'timestamptz' }) deadline_time!: Date;
  @Column({ type: 'bigint', transformer: numericTransformer }) deadline_time_epoch!: number;

  @Column({ type: 'boolean' }) finished!: boolean;
  @Column({ type: 'boolean' }) data_checked!: boolean;
  @Column({ type: 'boolean' }) is_previous!: boolean;
  @Column({ type: 'boolean' }) is_current!: boolean;
  @Column({ type: 'boolean' }) is_next!: boolean;

  @Column({ type: 'timestamptz', nullable: true }) release_time!: Date | null;
  @Column({ type: 'int', nullable: true }) average_entry_score!: number | null;
  @Column({ type: 'int', nullable: true }) highest_score!: number | null;
  @Column({ type: 'int', nullable: true }) top_element!: number | null;
  @Column({ type: 'int', nullable: true }) most_selected!: number | null;
  @Column({ type: 'int', nullable: true }) most_transferred_in!: number | null;
  @Column({ type: 'int', nullable: true }) most_captained!: number | null;
  @Column({ type: 'int', nullable: true }) most_vice_captained!: number | null;

  @Column({ type: 'jsonb' }) raw!: object;
  @Column({ type: 'timestamptz', default: () => 'now()' }) updated_at!: Date;
}
