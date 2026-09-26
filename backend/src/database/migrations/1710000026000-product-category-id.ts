import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class ProductCategoryId1710000026000 implements MigrationInterface {
  name = "ProductCategoryId1710000026000";
  async up(q: QueryRunner): Promise<void> {
    if (!(await q.hasColumn("products", "category_id")))
      await q.addColumn(
        "products",
        new TableColumn({
          name: "category_id",
          type: "varchar",
          length: "100",
          isNullable: true,
        }),
      );
    await q.query(
      "UPDATE products SET category_id = CASE UPPER(category) WHEN 'EQUIPMENT' THEN 'equipment' WHEN 'FAMILY' THEN 'family' WHEN 'AFTER-SALES' THEN 'after-sales' ELSE NULL END WHERE category_id IS NULL",
    );
    const cats = await q.getTable("product_categories");
    if (
      cats &&
      !(cats.foreignKeys ?? []).some(
        (f) =>
          f.columnNames.includes("id") &&
          f.referencedTableName === "product_categories",
      )
    ) {
      await q.createForeignKey(
        "products",
        new TableForeignKey({
          name: "fk_products_category_id",
          columnNames: ["category_id"],
          referencedTableName: "product_categories",
          referencedColumnNames: ["id"],
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
        }),
      );
    }
    await q.createIndex(
      "products",
      new TableIndex({
        name: "idx_products_category_id_active",
        columnNames: ["category_id", "is_active"],
      }),
    );
  }
  async down(q: QueryRunner): Promise<void> {
    const t = await q.getTable("products");
    const fk = t?.foreignKeys.find((f) => f.name === "fk_products_category_id");
    if (fk) await q.dropForeignKey("products", fk);
    if (await q.hasColumn("products", "category_id"))
      await q.dropColumn("products", "category_id");
  }
}
