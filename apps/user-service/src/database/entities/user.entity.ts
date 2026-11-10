import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** bigint приходит из pg строкой, переводим в number (Telegram ID безопасно помещается). */
const bigintTransformer = {
  to: (value?: number) => value,
  from: (value?: string | null) => (value === null ? value : Number(value)),
};

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'bigint', unique: true, transformer: bigintTransformer }) telegram_id!: number;
  @Column({ type: 'varchar', length: 64, nullable: true }) username!: string | null;
  @Column({ type: 'varchar', length: 5, default: 'ru' }) language!: string;
  @Column({ type: 'varchar', length: 64, default: 'UTC' }) timezone!: string;
  @Column({ type: 'varchar', length: 10, default: 'user' }) role!: 'user' | 'admin';
  @Column({ type: 'boolean', default: true }) is_active!: boolean;
  @Column({ type: 'timestamptz', default: () => 'now()' }) created_at!: Date;
  @Column({ type: 'timestamptz', default: () => 'now()' }) last_seen_at!: Date;
}
