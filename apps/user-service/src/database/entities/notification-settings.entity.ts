import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('notification_settings')
export class NotificationSettings {
  @PrimaryColumn({ type: 'uuid' }) user_id!: string;
  @Column({ type: 'int', array: true, default: () => "'{24,3}'" })
  deadline_reminder_hours!: number[];
  @Column({ type: 'boolean', default: true }) notify_report!: boolean;
  @Column({ type: 'boolean', default: true }) notify_injuries!: boolean;
  @Column({ type: 'boolean', default: true }) notify_price!: boolean;
  @Column({ type: 'varchar', length: 5, nullable: true }) quiet_from!: string | null;
  @Column({ type: 'varchar', length: 5, nullable: true }) quiet_to!: string | null;
  @Column({ type: 'timestamptz', default: () => 'now()' }) updated_at!: Date;
}
