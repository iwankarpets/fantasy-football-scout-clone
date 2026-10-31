import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type PlayerChangeType = 'price' | 'status' | 'news';

@Entity('player_changes')
export class PlayerChange {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' }) id!: number;

  /** = players.id */
  @Column({ type: 'int' }) player_id!: number;
  /** price | status | news (ограничено check-констрейнтом player_changes_type_chk) */
  @Column({ type: 'varchar', length: 10 }) type!: PlayerChangeType;

  /** Цена в десятых как строка: '61' = 6.1 */
  @Column({ type: 'text', nullable: true }) old_value!: string | null;
  @Column({ type: 'text', nullable: true }) new_value!: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' }) detected_at!: Date;
}