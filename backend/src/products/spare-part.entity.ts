import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type SparePartSpec = { key: string; value: string; unit?: string };

@Entity({ name: 'spare_parts' })
export class SparePartEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'part_number', type: 'varchar', length: 50, unique: true }) partNumber!: string;
  @Column({ type: 'varchar', length: 160, unique: true, nullable: true }) slug!: string | null;
  @Column({ name: 'name_en', type: 'varchar', length: 150 }) nameEn!: string;
  @Column({ name: 'name_fa', type: 'varchar', length: 150 }) nameFa!: string;
  @Column({ type: 'varchar', length: 100, default: '' }) category!: string;
  @Column({ name: 'short_description', type: 'varchar', length: 500, nullable: true }) shortDescription!: string | null;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'compatible_products', type: 'simple-json', default: '[]' }) compatibleProducts!: string[];
  @Column({ type: 'integer' }) price!: number;
  /** When true, public UI shows «توافقی» instead of a Rial amount. */
  @Column({ name: 'price_negotiable', type: 'boolean', default: false }) priceNegotiable!: boolean;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'stock_quantity', type: 'integer', default: 0 }) stockQuantity!: number;
  @Column({ name: 'reorder_level', type: 'integer', default: 5 }) reorderLevel!: number;
  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true }) imageUrl!: string | null;
  /** Extra gallery images (relative /media/… paths). First imageUrl is primary. */
  @Column({ type: 'simple-json', default: '[]' }) gallery!: string[];
  @Column({ type: 'varchar', length: 100, nullable: true }) brand!: string | null;
  @Column({ name: 'oem_code', type: 'varchar', length: 100, nullable: true }) oemCode!: string | null;
  @Column({ name: 'weight_grams', type: 'integer', nullable: true }) weightGrams!: number | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) dimensions!: string | null;
  @Column({ type: 'simple-json', default: '[]' }) specs!: SparePartSpec[];
  @Column({ name: 'warranty_months', type: 'integer', default: 12 }) warrantyMonths!: number;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
