import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('fixtures_read')
export class FixtureRead {
  @PrimaryColumn({ type: 'int' }) id!: number;
  @Column({ type: 'int' }) code!: number;
  @Column({ type: 'int', nullable: true }) event!: number | null;
  @Column({ type: 'int' }) team_h!: number;
  @Column({ type: 'int' }) team_a!: number;
  @Column({ type: 'int', nullable: true }) team_h_score!: number | null;
  @Column({ type: 'int', nullable: true }) team_a_score!: number | null;
  @Column({ type: 'timestamptz', nullable: true }) kickoff_time!: Date | null;
  @Column({ type: 'int' }) team_h_difficulty!: number;
  @Column({ type: 'int' }) team_a_difficulty!: number;
  @Column({ type: 'boolean' }) started!: boolean;
  @Column({ type: 'boolean' }) finished!: boolean;
  @Column({ type: 'boolean' }) finished_provisional!: boolean;
  @Column({ type: 'int' }) minutes!: number;
  @Column({ type: 'timestamptz', default: () => 'now()' }) synced_at!: Date;
}
