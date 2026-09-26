import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "order_items" })
export class OrderItemEntity {
  @PrimaryColumn("text") id!: string;
  @Column({ name: "order_id", type: "varchar", length: 100 }) orderId!: string;
  /** Legacy product line; empty string for spare-part-only lines. */
  @Column({ name: "product_id", type: "varchar", length: 100, default: "" })
  productId!: string;
  @Column({
    name: "item_type",
    type: "varchar",
    length: 50,
    default: "product",
  })
  itemType!: string;
  @Column({
    name: "spare_part_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  sparePartId!: string | null;
  @Column({
    name: "title_snapshot",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  titleSnapshot!: string | null;
  @Column({
    name: "sku_snapshot",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  skuSnapshot!: string | null;
  @Column({
    name: "image_snapshot",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  imageSnapshot!: string | null;
  @Column({ type: "integer" }) quantity!: number;
  @Column({ name: "unit_price", type: "integer" }) unitPrice!: number;
  @Column({ name: "line_total", type: "integer" }) lineTotal!: number;
  @Column({ type: "varchar", length: 3, default: "IRR" }) currency!: string;
  @Column({ name: "customizations_json", type: "simple-json", default: "{}" })
  customizationsJson!: Record<string, string>;
  @Column({ type: "varchar", length: 50, default: "pending" }) status!: string;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
}
