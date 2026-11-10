import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('watchlist')
export class Watchlist {
  @PrimaryColumn({ type: 'uuid' }) user_id!: string;
  @PrimaryColumn({ type: 'int' }) player_id!: number;
  @Column({ type: 'timestamptz', default: () => 'now()' }) added_at!: Date;
}
