import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProductExtensions1710000008000 implements MigrationInterface {
  name = 'CreateProductExtensions1710000008000';
  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    if (!(await queryRunner.hasTable('product_variants'))) await queryRunner.createTable(new Table({ name: 'product_variants', columns: [
      { name: 'id', type: 'varchar', isPrimary: true }, { name: 'product_id', type: 'varchar', length: '100' }, { name: 'sku_variant', type: 'varchar', length: '50' }, { name: 'variant_name_en', type: 'varchar', length: '100' }, { name: 'variant_name_fa', type: 'varchar', length: '100' }, { name: 'variant_code', type: 'varchar', length: '50', isNullable: true }, { name: 'specifications', type: 'text', default: "'{}'" }, { name: 'price_base', type: 'integer', isNullable: true }, { name: 'price_adjustment', type: 'integer', default: 0 }, { name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }, { name: 'stock_quantity', type: 'integer', default: 0 }, { name: 'is_active', type: 'boolean', default: true }, { name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'deleted_at', type: dateType, isNullable: true },
    ] }), true);
    if (!(await queryRunner.hasTable('product_specifications'))) await queryRunner.createTable(new Table({ name: 'product_specifications', columns: [
      { name: 'id', type: 'varchar', isPrimary: true }, { name: 'product_id', type: 'varchar', length: '100' }, { name: 'specification_key', type: 'varchar', length: '100' }, { name: 'specification_value', type: 'varchar', length: '255' }, { name: 'unit', type: 'varchar', length: '50', isNullable: true }, { name: 'spec_category', type: 'varchar', length: '50' }, { name: 'display_order', type: 'integer', default: 0 }, { name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' },
    ] }), true);
    if (!(await queryRunner.hasTable('spare_parts'))) await queryRunner.createTable(new Table({ name: 'spare_parts', columns: [
      { name: 'id', type: 'varchar', isPrimary: true }, { name: 'part_number', type: 'varchar', length: '50' }, { name: 'name_en', type: 'varchar', length: '150' }, { name: 'name_fa', type: 'varchar', length: '150' }, { name: 'description', type: 'text' }, { name: 'compatible_products', type: 'text', default: "'[]'" }, { name: 'price', type: 'integer' }, { name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }, { name: 'stock_quantity', type: 'integer', default: 0 }, { name: 'reorder_level', type: 'integer', default: 5 }, { name: 'image_url', type: 'varchar', length: '500', isNullable: true }, { name: 'warranty_months', type: 'integer', default: 12 }, { name: 'is_active', type: 'boolean', default: true }, { name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'deleted_at', type: dateType, isNullable: true },
    ] }), true);
  }
  async down(queryRunner: QueryRunner): Promise<void> { for (const table of ['spare_parts', 'product_specifications', 'product_variants']) if (await queryRunner.hasTable(table)) await queryRunner.dropTable(table); }
}
