import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { InvoicePaymentStatus } from "./invoice-status";

const dateColumnType: "datetime" | "timestamp" =
  process.env.DB_DRIVER === "postgres" ? "timestamp" : "datetime";

export type InvoiceLineItem = {
  itemType: string;
  sparePartId?: string | null;
  productId?: string | null;
  title: string;
  sku: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
};

export type InvoicePartySnapshot = {
  customerId: string;
  userId?: string;
  companyName?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  industry?: string | null;
  registrationNumber?: string | null;
};

@Entity({ name: "invoices" })
export class InvoiceEntity {
  @PrimaryColumn("text") id!: string;
  @Column({ name: "invoice_number", type: "varchar", length: 50, unique: true })
  invoiceNumber!: string;
  @Column({ name: "order_id", type: "varchar", length: 100, nullable: true })
  orderId!: string | null;
  @Column({
    name: "quotation_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  quotationId!: string | null;
  @Column({ name: "customer_id", type: "varchar", length: 100 })
  customerId!: string;
  @Column({ name: "due_date", type: dateColumnType }) dueDate!: Date;
  @Column({ name: "total_before_tax", type: "integer" })
  totalBeforeTax!: number;
  @Column({ name: "tax_amount", type: "integer", default: 0 })
  taxAmount!: number;
  @Column({ name: "total_after_tax", type: "integer" }) totalAfterTax!: number;
  @Column({ type: "varchar", length: 3, default: "IRR" }) currency!: string;
  @Column({
    name: "payment_status",
    type: "varchar",
    length: 50,
    default: InvoicePaymentStatus.Pending,
  })
  paymentStatus!: InvoicePaymentStatus | string;
  @Column({ type: "text", nullable: true }) notes!: string | null;
  /** Frozen line items at invoice creation — historical truth for 360° view. */
  @Column({ name: "line_items_json", type: "simple-json", default: "[]" })
  lineItemsJson!: InvoiceLineItem[];
  @Column({
    name: "customer_snapshot_json",
    type: "simple-json",
    default: "{}",
  })
  customerSnapshotJson!: InvoicePartySnapshot;
  @Column({
    name: "shipping_snapshot_json",
    type: "simple-json",
    default: "{}",
  })
  shippingSnapshotJson!: Record<string, string>;
  @Column({ name: "billing_snapshot_json", type: "simple-json", default: "{}" })
  billingSnapshotJson!: Record<string, string>;
  @Column({
    name: "payment_method",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  paymentMethod!: string | null;
  @Column({ name: "paid_at", type: dateColumnType, nullable: true })
  paidAt!: Date | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt!: Date | null;
}
