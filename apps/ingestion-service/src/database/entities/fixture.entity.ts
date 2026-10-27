import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('fixtures')
@Index('idx_fixtures_event', ['event'])
@Index('idx_fixtures_team_h', ['team_h'])
@Index('idx_fixtures_team_a', ['team_a'])
export class Fixture {
  @PrimaryColumn({ type: 'int' }) id!: number;
  @Column({ type: 'int' }) code!: number;

  /** Номер тура = gameweeks.id; null у перенесённых матчей */
  @Column({ type: 'int', nullable: true }) event!: number | null;

  @Column({ type: 'int' }) team_h!: number;
  @Column({ type: 'int' }) team_a!: number;
  @Column({ type: 'int', nullable: true }) team_h_score!: number | null;
  @Column({ type: 'int', nullable: true }) team_a_score!: number | null;
  @Column({ type: 'timestamptz', nullable: true }) kickoff_time!: Date | null;

  /** 1–5, именно они нужны для team_fixture_difficulty в Analytics */
  @Column({ type: 'smallint' }) team_h_difficulty!: number;
  @Column({ type: 'smallint' }) team_a_difficulty!: number;

  @Column({ type: 'boolean', nullable: true }) started!: boolean | null;
  @Column({ type: 'boolean', default: false }) finished!: boolean;
  @Column({ type: 'boolean', default: false }) finished_provisional!: boolean;
  @Column({ type: 'int', default: 0 }) minutes!: number;

  @Column({ type: 'timestamptz', default: () => 'now()' }) updated_at!: Date;
}