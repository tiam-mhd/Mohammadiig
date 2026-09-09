import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** نمونه‌کارهای اجراشده برای مشتریان — محتوای عمومی سایت */
@Entity({ name: 'portfolio_works' })
export class PortfolioWorkEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  slug!: string;

  @Column({ name: 'title_fa', type: 'varchar', length: 200 })
  titleFa!: string;

  @Column({ name: 'title_en', type: 'varchar', length: 200 })
  titleEn!: string;

  @Column({ name: 'summary_fa', type: 'text' })
  summaryFa!: string;

  @Column({ name: 'description_fa', type: 'text' })
  descriptionFa!: string;

  @Column({ name: 'client_name', type: 'varchar', length: 200, nullable: true })
  clientName!: string | null;

  @Column({ name: 'work_category', type: 'varchar', length: 80, default: 'entertainment' })
  workCategory!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ name: 'location_detail', type: 'varchar', length: 500, nullable: true })
  locationDetail!: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ name: 'cover_image_url', type: 'varchar', length: 500, nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: 'simple-json', default: '[]' })
  gallery!: string[];

  @Column({ type: 'simple-json', default: '[]' })
  highlights!: string[];

  @Column({ name: 'area_or_capacity', type: 'varchar', length: 200, nullable: true })
  areaOrCapacity!: string | null;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
