import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'projects' })
export class ProjectEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'project_code', type: 'varchar', length: 50, unique: true }) projectCode!: string;
  @Column({ name: 'project_name', type: 'varchar', length: 200 }) projectName!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'customer_id', type: 'varchar', length: 100 }) customerId!: string;
  @Column({ name: 'assigned_to', type: 'varchar', length: 100, nullable: true }) assignedTo!: string | null;
  @Column({ name: 'project_type', type: 'varchar', length: 50 }) projectType!: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) country!: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) city!: string | null;
  @Column({ name: 'start_date', type: 'date' }) startDate!: string;
  @Column({ name: 'expected_completion_date', type: 'date' }) expectedCompletionDate!: string;
  @Column({ name: 'budget_total', type: 'integer' }) budgetTotal!: number;
  @Column({ name: 'budget_spent', type: 'integer', default: 0 }) budgetSpent!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'mig_investment_percentage', type: 'integer', default: 0 }) migInvestmentPercentage!: number;
  @Column({ name: 'profit_sharing_percentage', type: 'integer', default: 0 }) profitSharingPercentage!: number;
  @Column({ type: 'varchar', length: 50, default: 'planning' }) status!: string;
  @Column({ type: 'simple-json', default: '[]' }) documents!: Array<Record<string, string>>;
  @Column({ name: 'created_by', type: 'varchar', length: 100 }) createdBy!: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
