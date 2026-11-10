import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('outbox_events')
export class OutboxEvent {
  /** Он же event_id в конверте. */
  @PrimaryColumn({ type: 'uuid' }) id!: string;
  @Column({ type: 'varchar', length: 100 }) type!: string;
  @Column({ type: 'jsonb' }) payload!: Record<string, unknown>;
  @Column({ type: 'timestamptz', default: () => 'now()' }) created_at!: Date;
  @Column({ type: 'timestamptz', nullable: true }) published_at!: Date | null;
  @Column({ type: 'varchar', length: 200, nullable: true }) dedup_key!: string | null;
}
