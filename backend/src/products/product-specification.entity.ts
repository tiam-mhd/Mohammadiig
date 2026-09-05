import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'product_specifications' })
export class ProductSpecificationEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'product_id', type: 'varchar', length: 100 }) productId!: string;
  @Column({ name: 'specification_key', type: 'varchar', length: 100 }) specificationKey!: string;
  @Column({ name: 'specification_value', type: 'varchar', length: 255 }) specificationValue!: string;
  @Column({ type: 'varchar', length: 50, nullable: true }) unit!: string | null;
  @Column({ name: 'spec_category', type: 'varchar', length: 50 }) specCategory!: string;
  @Column({ name: 'display_order', type: 'integer', default: 0 }) displayOrder!: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
