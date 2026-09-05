import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'invoice_id', type: 'varchar', length: 100 }) invoiceId!: string;
  @Column({ name: 'order_id', type: 'varchar', length: 100, nullable: true }) orderId!: string | null;
  @Column({ type: 'integer' }) amount!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ name: 'payment_method', type: 'varchar', length: 50 }) paymentMethod!: string;
  @Column({ name: 'transaction_id', type: 'varchar', length: 100, nullable: true }) transactionId!: string | null;
  @Column({ name: 'payment_status', type: 'varchar', length: 50, default: 'pending' }) paymentStatus!: string;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @Column({ name: 'processed_by', type: 'varchar', length: 100, nullable: true }) processedBy!: string | null;
  @CreateDateColumn({ name: 'payment_date' }) paymentDate!: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
