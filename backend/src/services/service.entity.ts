import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'services' })
export class ServiceEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'name_en', type: 'varchar', length: 150 }) nameEn!: string;
  @Column({ name: 'name_fa', type: 'varchar', length: 150 }) nameFa!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'service_category', type: 'varchar', length: 50 }) serviceCategory!: string;
  @Column({ name: 'base_price', type: 'integer' }) basePrice!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'unit_type', type: 'varchar', length: 50, default: 'fixed' }) unitType!: string;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
