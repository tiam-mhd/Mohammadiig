import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'project_phases' })
export class ProjectPhaseEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'project_id', type: 'varchar', length: 100 }) projectId!: string;
  @Column({ name: 'phase_number', type: 'integer' }) phaseNumber!: number;
  @Column({ name: 'phase_name_en', type: 'varchar', length: 100 }) phaseNameEn!: string;
  @Column({ name: 'phase_name_fa', type: 'varchar', length: 100 }) phaseNameFa!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'start_date', type: 'date' }) startDate!: string;
  @Column({ name: 'end_date', type: 'date' }) endDate!: string;
  @Column({ type: 'varchar', length: 50, default: 'pending' }) status!: string;
  @Column({ type: 'simple-json', default: '[]' }) deliverables!: Array<Record<string, string>>;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
