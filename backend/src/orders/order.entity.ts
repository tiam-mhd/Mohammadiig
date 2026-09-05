import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true }) orderNumber!: string;
  @Column({ name: 'customer_id', type: 'varchar', length: 100 }) customerId!: string;
  @Column({ name: 'created_by', type: 'varchar', length: 100 }) createdBy!: string;
  @Column({ type: 'varchar', length: 50, default: 'pending' }) status!: string;
  @Column({ name: 'order_type', type: 'varchar', length: 50, default: 'custom' }) orderType!: string;
  @Column({ name: 'shipping_address', type: 'simple-json', default: '{}' }) shippingAddress!: Record<string, string>;
  @Column({ name: 'billing_address', type: 'simple-json', default: '{}' }) billingAddress!: Record<string, string>;
  @Column({ type: 'integer' }) subtotal!: number;
  @Column({ name: 'tax_amount', type: 'integer', default: 0 }) taxAmount!: number;
  @Column({ name: 'shipping_cost', type: 'integer', default: 0 }) shippingCost!: number;
  @Column({ name: 'discount_amount', type: 'integer', default: 0 }) discountAmount!: number;
  @Column({ name: 'total_amount', type: 'integer' }) totalAmount!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'payment_status', type: 'varchar', length: 50, default: 'unpaid' }) paymentStatus!: string;
  @Column({ name: 'reference_quotation_id', type: 'varchar', length: 100, nullable: true }) referenceQuotationId!: string | null;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
