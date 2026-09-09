import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'spare_part_categories' })
export class SparePartCategoryEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column({ name: 'name_en', type: 'varchar', length: 100 })
  nameEn!: string;

  @Column({ name: 'name_fa', type: 'varchar', length: 100 })
  nameFa!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ name: 'description_fa', type: 'text' })
  descriptionFa!: string;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
