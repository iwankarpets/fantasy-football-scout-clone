import { Column, Entity, PrimaryColumn } from 'typeorm';
import { numericTransformer } from '../transformers';

@Entity('teams_read')
export class TeamRead {
  @PrimaryColumn({ type: 'int' }) id!: number;
  @Column({ type: 'int' }) code!: number;
  @Column({ type: 'varchar', length: 100 }) name!: string;
  @Column({ type: 'varchar', length: 10 }) short_name!: string;
  @Column({ type: 'int' }) strength_overall_home!: number;
  @Column({ type: 'int' }) strength_overall_away!: number;
  @Column({ type: 'int' }) strength_attack_home!: number;
  @Column({ type: 'int' }) strength_attack_away!: number;
  @Column({ type: 'int' }) strength_defence_home!: number;
  @Column({ type: 'int' }) strength_defence_away!: number;
  @Column({ type: 'int' }) played!: number;
  @Column({ type: 'int' }) win!: number;
  @Column({ type: 'int' }) draw!: number;
  @Column({ type: 'int' }) loss!: number;
  @Column({ type: 'int' }) points!: number;
  @Column({ type: 'int' }) position!: number;
  @Column({ type: 'numeric', nullable: true, transformer: numericTransformer }) form!:
    number | null;
  @Column({ type: 'int', nullable: true }) strength!: number | null;
  @Column({ type: 'timestamptz', default: () => 'now()' }) synced_at!: Date;
}
