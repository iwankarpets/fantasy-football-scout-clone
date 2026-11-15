import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { bigintToNumber } from '../transformers';

@Entity('recipients')
export class Recipient {
  @PrimaryColumn({ type: 'uuid' }) user_id!: string;
  @Column({ type: 'bigint', transformer: bigintToNumber }) telegram_chat_id!: number;
  @Column({ type: 'varchar', length: 64, default: 'UTC' }) timezone!: string;
  @Column({ type: 'varchar', length: 5, default: 'ru' }) language!: string;
  @Column({ type: 'int', array: true, default: () => "'{24,3}'" })
  deadline_reminder_hours!: number[];
  @Column({ type: 'boolean', default: true }) notify_report!: boolean;
  @Column({ type: 'boolean', default: true }) notify_injuries!: boolean;
  @Column({ type: 'boolean', default: true }) notify_price!: boolean;
  @Column({ type: 'varchar', length: 5, nullable: true }) quiet_from!: string | null;
  @Column({ type: 'varchar', length: 5, nullable: true }) quiet_to!: string | null;
  @Column({ type: 'boolean', default: true }) is_active!: boolean;
  @Column({ type: 'timestamptz', default: () => 'now()' }) created_at!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
