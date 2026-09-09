import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** پروژه‌های بهره‌برداری / مشارکت / سرمایه‌گذاری — محتوای شرکت، نه ثبت مشتری */
@Entity({ name: 'projects' })
export class ProjectEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column({ name: 'project_code', type: 'varchar', length: 50, unique: true })
  projectCode!: string;

  @Column({ name: 'project_name', type: 'varchar', length: 200 })
  projectName!: string;

  @Column({ name: 'name_en', type: 'varchar', length: 200, nullable: true })
  nameEn!: string | null;

  @Column({ type: 'varchar', length: 120, unique: true, nullable: true })
  slug!: string | null;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'summary_fa', type: 'text', nullable: true })
  summaryFa!: string | null;

  /** @deprecated legacy customer link — no longer used for registration */
  @Column({ name: 'customer_id', type: 'varchar', length: 100, nullable: true })
  customerId!: string | null;

  @Column({ name: 'client_display_name', type: 'varchar', length: 200, nullable: true })
  clientDisplayName!: string | null;

  @Column({ name: 'assigned_to', type: 'varchar', length: 100, nullable: true })
  assignedTo!: string | null;

  /** operation | partnership | investment */
  @Column({ name: 'project_type', type: 'varchar', length: 50 })
  projectType!: string;

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

  @Column({ name: 'expected_completion_date', type: 'date', nullable: true })
  expectedCompletionDate!: string | null;

  @Column({ name: 'completion_date', type: 'date', nullable: true })
  completionDate!: string | null;

  @Column({ name: 'budget_total', type: 'integer', default: 0 })
  budgetTotal!: number;

  @Column({ name: 'budget_spent', type: 'integer', default: 0 })
  budgetSpent!: number;

  @Column({ type: 'varchar', length: 3, default: 'IRR' })
  currency!: string;

  @Column({ name: 'mig_investment_percentage', type: 'integer', default: 0 })
  migInvestmentPercentage!: number;

  @Column({ name: 'profit_sharing_percentage', type: 'integer', default: 0 })
  profitSharingPercentage!: number;

  @Column({ type: 'varchar', length: 50, default: 'planning' })
  status!: string;

  @Column({ name: 'cover_image_url', type: 'varchar', length: 500, nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: 'simple-json', default: '[]' })
  gallery!: string[];

  @Column({ type: 'simple-json', default: '[]' })
  highlights!: string[];

  @Column({ type: 'simple-json', default: '[]' })
  documents!: Array<Record<string, string>>;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
