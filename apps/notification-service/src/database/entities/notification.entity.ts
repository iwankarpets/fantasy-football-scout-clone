import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationStatus = 'queued' | 'sent' | 'failed';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) user_id!: string;
  @Column({ type: 'varchar', length: 50 }) type!: string;
  @Column({ type: 'varchar', length: 200, unique: true }) dedup_key!: string;
  @Column({ type: 'jsonb' }) payload!: Record<string, unknown>;
  @Column({ type: 'varchar', length: 10, default: 'queued' }) status!: NotificationStatus;
  @Column({ type: 'int', default: 0 }) attempts!: number;
  @Column({ type: 'text', nullable: true }) error!: string | null;
  @Column({ type: 'timestamptz', default: () => 'now()' }) scheduled_at!: Date;
  @Column({ type: 'timestamptz', nullable: true }) sent_at!: Date | null;
  @Column({ type: 'timestamptz', default: () => 'now()' }) created_at!: Date;
}
