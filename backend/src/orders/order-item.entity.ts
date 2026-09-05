import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'order_items' })
export class OrderItemEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'order_id', type: 'varchar', length: 100 }) orderId!: string;
  @Column({ name: 'product_id', type: 'varchar', length: 100 }) productId!: string;
  @Column({ type: 'integer' }) quantity!: number;
  @Column({ name: 'unit_price', type: 'integer' }) unitPrice!: number;
  @Column({ name: 'line_total', type: 'integer' }) lineTotal!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'customizations_json', type: 'simple-json', default: '{}' }) customizationsJson!: Record<string, string>;
  @Column({ type: 'varchar', length: 50, default: 'pending' }) status!: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
