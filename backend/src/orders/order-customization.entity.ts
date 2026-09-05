import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'order_customizations' })
export class OrderCustomizationEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'order_item_id', type: 'varchar', length: 100 }) orderItemId!: string;
  @Column({ name: 'customization_type', type: 'varchar', length: 50 }) customizationType!: string;
  @Column({ name: 'customization_name_fa', type: 'varchar', length: 100, nullable: true }) customizationNameFa!: string | null;
  @Column({ name: 'customization_value', type: 'varchar', length: 255 }) customizationValue!: string;
  @Column({ name: 'additional_cost', type: 'integer', default: 0 }) additionalCost!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'is_approved', type: 'boolean', default: false }) isApproved!: boolean;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
