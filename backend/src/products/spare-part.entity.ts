import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'spare_parts' })
export class SparePartEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'part_number', type: 'varchar', length: 50, unique: true }) partNumber!: string;
  @Column({ name: 'name_en', type: 'varchar', length: 150 }) nameEn!: string;
  @Column({ name: 'name_fa', type: 'varchar', length: 150 }) nameFa!: string;
  @Column({ type: 'varchar', length: 100, default: '' }) category!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'compatible_products', type: 'simple-json', default: '[]' }) compatibleProducts!: string[];
  @Column({ type: 'integer' }) price!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'stock_quantity', type: 'integer', default: 0 }) stockQuantity!: number;
  @Column({ name: 'reorder_level', type: 'integer', default: 5 }) reorderLevel!: number;
  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true }) imageUrl!: string | null;
  @Column({ name: 'warranty_months', type: 'integer', default: 12 }) warrantyMonths!: number;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
