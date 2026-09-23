import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Spare-parts retail commerce: richer catalog fields, order-line snapshots,
 * and full invoice snapshots for customer 360° history.
 */
export class SparePartsCommerce1710000020000 implements MigrationInterface {
  name = 'SparePartsCommerce1710000020000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('spare_parts')) {
      const spareCols: Array<{ name: string; column: TableColumn }> = [
        {
          name: 'slug',
          column: new TableColumn({
            name: 'slug',
            type: 'varchar',
            length: '160',
            isNullable: true,
          }),
        },
        {
          name: 'short_description',
          column: new TableColumn({
            name: 'short_description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          }),
        },
        {
          name: 'gallery',
          column: new TableColumn({
            name: 'gallery',
            type: 'text',
            default: "'[]'",
          }),
        },
        {
          name: 'brand',
          column: new TableColumn({
            name: 'brand',
            type: 'varchar',
            length: '100',
            isNullable: true,
          }),
        },
        {
          name: 'oem_code',
          column: new TableColumn({
            name: 'oem_code',
            type: 'varchar',
            length: '100',
            isNullable: true,
          }),
        },
        {
          name: 'weight_grams',
          column: new TableColumn({
            name: 'weight_grams',
            type: 'integer',
            isNullable: true,
          }),
        },
        {
          name: 'dimensions',
          column: new TableColumn({
            name: 'dimensions',
            type: 'varchar',
            length: '120',
            isNullable: true,
          }),
        },
        {
          name: 'specs',
          column: new TableColumn({
            name: 'specs',
            type: 'text',
            default: "'[]'",
          }),
        },
      ];

      for (const entry of spareCols) {
        if (!(await queryRunner.hasColumn('spare_parts', entry.name))) {
          await queryRunner.addColumn('spare_parts', entry.column);
        }
      }

      // Backfill slug from part_number; append id fragment to guarantee uniqueness
      // (soft-deleted duplicates / empty part numbers must not block UNIQUE index).
      await queryRunner.query(`
        UPDATE spare_parts
        SET slug = LOWER(REPLACE(REPLACE(COALESCE(NULLIF(TRIM(part_number), ''), id), ' ', '-'), '_', '-'))
          || '-' || SUBSTR(REPLACE(id, '-', ''), 1, 6)
        WHERE slug IS NULL OR TRIM(slug) = ''
      `);

      // Resolve any remaining duplicate slugs before creating UNIQUE index
      await queryRunner.query(`
        UPDATE spare_parts
        SET slug = slug || '-' || SUBSTR(REPLACE(id, '-', ''), 1, 6)
        WHERE slug IN (
          SELECT slug FROM spare_parts WHERE slug IS NOT NULL AND TRIM(slug) != ''
          GROUP BY slug HAVING COUNT(*) > 1
        )
        AND id NOT IN (
          SELECT MIN(id) FROM spare_parts WHERE slug IS NOT NULL AND TRIM(slug) != '' GROUP BY slug
        )
      `);

      const table = await queryRunner.getTable('spare_parts');
      const hasSlugIndex = table?.indices.some((idx) => idx.name === 'IDX_spare_parts_slug');
      if (!hasSlugIndex) {
        await queryRunner.createIndex(
          'spare_parts',
          new TableIndex({
            name: 'IDX_spare_parts_slug',
            columnNames: ['slug'],
            isUnique: true,
          }),
        );
      }
    }

    if (await queryRunner.hasTable('order_items')) {
      const itemCols: Array<{ name: string; column: TableColumn }> = [
        {
          name: 'item_type',
          column: new TableColumn({
            name: 'item_type',
            type: 'varchar',
            length: '50',
            default: "'product'",
          }),
        },
        {
          name: 'spare_part_id',
          column: new TableColumn({
            name: 'spare_part_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          }),
        },
        {
          name: 'title_snapshot',
          column: new TableColumn({
            name: 'title_snapshot',
            type: 'varchar',
            length: '255',
            isNullable: true,
          }),
        },
        {
          name: 'sku_snapshot',
          column: new TableColumn({
            name: 'sku_snapshot',
            type: 'varchar',
            length: '100',
            isNullable: true,
          }),
        },
        {
          name: 'image_snapshot',
          column: new TableColumn({
            name: 'image_snapshot',
            type: 'varchar',
            length: '500',
            isNullable: true,
          }),
        },
      ];
      for (const entry of itemCols) {
        if (!(await queryRunner.hasColumn('order_items', entry.name))) {
          await queryRunner.addColumn('order_items', entry.column);
        }
      }
    }

    if (await queryRunner.hasTable('invoices')) {
      const invCols: Array<{ name: string; column: TableColumn }> = [
        {
          name: 'line_items_json',
          column: new TableColumn({
            name: 'line_items_json',
            type: 'text',
            default: "'[]'",
          }),
        },
        {
          name: 'customer_snapshot_json',
          column: new TableColumn({
            name: 'customer_snapshot_json',
            type: 'text',
            default: "'{}'",
          }),
        },
        {
          name: 'shipping_snapshot_json',
          column: new TableColumn({
            name: 'shipping_snapshot_json',
            type: 'text',
            default: "'{}'",
          }),
        },
        {
          name: 'billing_snapshot_json',
          column: new TableColumn({
            name: 'billing_snapshot_json',
            type: 'text',
            default: "'{}'",
          }),
        },
        {
          name: 'payment_method',
          column: new TableColumn({
            name: 'payment_method',
            type: 'varchar',
            length: '50',
            isNullable: true,
          }),
        },
        {
          name: 'paid_at',
          column: new TableColumn({
            name: 'paid_at',
            type: process.env.DB_DRIVER === 'postgres' ? 'timestamp' : 'datetime',
            isNullable: true,
          }),
        },
      ];
      for (const entry of invCols) {
        if (!(await queryRunner.hasColumn('invoices', entry.name))) {
          await queryRunner.addColumn('invoices', entry.column);
        }
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('invoices')) {
      for (const col of [
        'paid_at',
        'payment_method',
        'billing_snapshot_json',
        'shipping_snapshot_json',
        'customer_snapshot_json',
        'line_items_json',
      ]) {
        if (await queryRunner.hasColumn('invoices', col)) {
          await queryRunner.dropColumn('invoices', col);
        }
      }
    }

    if (await queryRunner.hasTable('order_items')) {
      for (const col of [
        'image_snapshot',
        'sku_snapshot',
        'title_snapshot',
        'spare_part_id',
        'item_type',
      ]) {
        if (await queryRunner.hasColumn('order_items', col)) {
          await queryRunner.dropColumn('order_items', col);
        }
      }
    }

    if (await queryRunner.hasTable('spare_parts')) {
      const table = await queryRunner.getTable('spare_parts');
      const slugIndex = table?.indices.find((idx) => idx.name === 'IDX_spare_parts_slug');
      if (slugIndex) await queryRunner.dropIndex('spare_parts', slugIndex);
      for (const col of [
        'specs',
        'dimensions',
        'weight_grams',
        'oem_code',
        'brand',
        'gallery',
        'short_description',
        'slug',
      ]) {
        if (await queryRunner.hasColumn('spare_parts', col)) {
          await queryRunner.dropColumn('spare_parts', col);
        }
      }
    }
  }
}
