import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

const dateColumnType: 'datetime' | 'timestamp' = process.env.DB_DRIVER === 'postgres' ? 'timestamp' : 'datetime';

export interface QuotationItem { productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number; customizations: Record<string, string>; }

@Entity({ name: 'quotations' })
export class QuotationEntity {
  @PrimaryColumn('text') id!: string;
  @Column({ name: 'quotation_number', type: 'varchar', length: 50, unique: true }) quotationNumber!: string;
  @Column({ name: 'customer_id', type: 'varchar', length: 100 }) customerId!: string;
  @Column({ name: 'quoted_by', type: 'varchar', length: 100, nullable: true }) quotedBy!: string | null;
  @Column({ name: 'valid_until', type: dateColumnType }) validUntil!: Date;
  @Column({ type: 'simple-json', default: '[]' }) items!: QuotationItem[];
  @Column({ type: 'integer' }) subtotal!: number;
  @Column({ name: 'tax_amount', type: 'integer', default: 0 }) taxAmount!: number;
  @Column({ name: 'tax_rate', type: 'integer', default: 0 }) taxRate!: number;
  @Column({ name: 'discount_amount', type: 'integer', default: 0 }) discountAmount!: number;
  @Column({ name: 'total_amount', type: 'integer' }) totalAmount!: number;
  @Column({ type: 'varchar', length: 3, default: 'IRR' }) currency!: string;
  @Column({ type: 'varchar', length: 50, default: 'draft' }) status!: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  @Column({ name: 'terms_and_conditions', type: 'text', nullable: true }) termsAndConditions!: string | null;
  @Column({ type: 'text', nullable: true }) notes!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deletedAt!: Date | null;
}
