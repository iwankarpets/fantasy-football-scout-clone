import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type SyncRunStatus = 'running' | 'success' | 'failed' | 'skipped';

@Entity('sync_runs')
export class SyncRun {
  @PrimaryGeneratedColumn({ type: 'int' }) id!: number;
  @Column({ type: 'varchar', length: 200 }) endpoint!: string;
  @Column({ type: 'timestamptz', default: () => 'now()' }) started_at!: Date;
  @Column({ type: 'timestamptz', nullable: true }) finished_at!: Date | null;
  @Column({ type: 'varchar', length: 20, default: 'running' }) status!: SyncRunStatus;
  @Column({ type: 'int', nullable: true }) items_count!: number | null;
  @Column({ type: 'varchar', length: 64, nullable: true }) payload_hash!: string | null;
  @Column({ type: 'text', nullable: true }) error!: string | null;
}
