import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'product_variants' })
export class ProductVariantEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'product_id', type: 'varchar', length: 100 }) productId!: string;
  @Column({ name: 'sku_variant', type: 'varchar', length: 50, unique: true }) skuVariant!: string;
  @Column({ name: 'variant_name_en', type: 'varchar', length: 100 }) variantNameEn!: string;
  @Column({ name: 'variant_name_fa', type: 'varchar', length: 100 }) variantNameFa!: string;
  @Column({ name: 'variant_code', type: 'varchar', length: 50, nullable: true }) variantCode!: string | null;
  @Column({ type: 'simple-json', default: '{}' }) specifications!: Record<string, unknown>;
  @Column({ name: 'price_base', type: 'integer', nullable: true }) priceBase!: number | null;
  @Column({ name: 'price_adjustment', type: 'integer', default: 0 }) priceAdjustment!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'stock_quantity', type: 'integer', default: 0 }) stockQuantity!: number;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
