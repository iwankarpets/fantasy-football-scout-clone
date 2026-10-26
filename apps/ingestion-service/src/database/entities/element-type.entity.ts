import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('element_types')
export class ElementType {
  @PrimaryColumn({ type: 'int' }) id!: number;
  @Column({ type: 'varchar', length: 50 }) singular_name!: string;
  @Column({ type: 'varchar', length: 10 }) singular_name_short!: string;
  @Column({ type: 'varchar', length: 50 }) plural_name!: string;
  @Column({ type: 'varchar', length: 10 }) plural_name_short!: string;
  @Column({ type: 'int' }) squad_select!: number;
  @Column({ type: 'int' }) squad_min_play!: number;
  @Column({ type: 'int' }) squad_max_play!: number;
  @Column({ type: 'int' }) element_count!: number;
  @Column({ type: 'timestamptz', default: () => 'now()' }) updated_at!: Date;
}
