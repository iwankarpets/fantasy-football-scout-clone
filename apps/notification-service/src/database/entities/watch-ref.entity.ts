import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('watch_refs')
export class WatchRef {
  @PrimaryColumn({ type: 'uuid' }) user_id!: string;
  @PrimaryColumn({ type: 'int' }) player_id!: number;
  @Column({ type: 'timestamptz', default: () => 'now()' }) created_at!: Date;
}
