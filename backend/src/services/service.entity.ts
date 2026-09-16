import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'services' })
export class ServiceEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'name_en', type: 'varchar', length: 150 }) nameEn!: string;
  @Column({ name: 'name_fa', type: 'varchar', length: 150 }) nameFa!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'service_category', type: 'varchar', length: 50 }) serviceCategory!: string;
  @Column({ name: 'base_price', type: 'integer', nullable: true }) basePrice!: number | null;
  /** When true, public UI shows «توافقی» instead of a Rial amount. */
  @Column({ name: 'price_negotiable', type: 'boolean', default: false }) priceNegotiable!: boolean;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'unit_type', type: 'varchar', length: 50, default: 'fixed' }) unitType!: string;
  @Column({ name: 'cover_image_url', type: 'varchar', length: 500, nullable: true }) coverImageUrl!: string | null;
  @Column({ type: 'simple-json', default: '[]' }) gallery!: string[];
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
