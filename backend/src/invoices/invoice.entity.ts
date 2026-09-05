import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

const dateColumnType: 'datetime' | 'timestamp' = process.env.DB_DRIVER === 'postgres' ? 'timestamp' : 'datetime';

@Entity({ name: 'invoices' })
export class InvoiceEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'invoice_number', type: 'varchar', length: 50, unique: true }) invoiceNumber!: string;
  @Column({ name: 'order_id', type: 'varchar', length: 100, nullable: true }) orderId!: string | null;
  @Column({ name: 'quotation_id', type: 'varchar', length: 100, nullable: true }) quotationId!: string | null;
  @Column({ name: 'customer_id', type: 'varchar', length: 100 }) customerId!: string;
  @Column({ name: 'due_date', type: dateColumnType }) dueDate!: Date;
  @Column({ name: 'total_before_tax', type: 'integer' }) totalBeforeTax!: number;
  @Column({ name: 'tax_amount', type: 'integer', default: 0 }) taxAmount!: number;
  @Column({ name: 'total_after_tax', type: 'integer' }) totalAfterTax!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'payment_status', type: 'varchar', length: 50, default: 'pending' }) paymentStatus!: string;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
