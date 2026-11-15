import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('processed_events')
export class ProcessedEvent {
  @PrimaryColumn({ type: 'uuid' }) event_id!: string;
  @Column({ type: 'timestamptz', default: () => 'now()' }) processed_at!: Date;
}
