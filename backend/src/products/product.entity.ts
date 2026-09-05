import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku!: string;

  @Column({ name: 'name_en', type: 'varchar', length: 200 })
  nameEn!: string;

  @Column({ name: 'name_fa', type: 'varchar', length: 200 })
  nameFa!: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug!: string;

  @Column({ name: 'description_short_fa', type: 'varchar', length: 500 })
  descriptionShortFa!: string;

  @Column({ type: 'simple-json', default: '{}' })
  specifications!: Record<string, unknown>;

  @Column({ name: 'price_base', type: 'integer' })
  priceBase!: number;

  @Column({ type: 'varchar', length: 3, default: 'IRR' })
  currency!: 'IRR';

  @Column({ type: 'varchar', length: 40 })
  category!: string;

  @Column({ name: 'thumbnail_image_url', type: 'varchar', length: 500, nullable: true })
  thumbnailImageUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
