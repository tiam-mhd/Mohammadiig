import { MigrationInterface, QueryRunner, Table, TableColumn, TableUnique } from 'typeorm';

export class CreateProductCategories1710000001000 implements MigrationInterface {
  name = 'CreateProductCategories1710000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('product_categories')) return;
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';

    await queryRunner.createTable(new Table({
      name: 'product_categories',
      columns: [
        new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
        new TableColumn({ name: 'name_en', type: 'varchar', length: '100' }),
        new TableColumn({ name: 'name_fa', type: 'varchar', length: '100' }),
        new TableColumn({ name: 'slug', type: 'varchar', length: '100' }),
        new TableColumn({ name: 'description_fa', type: 'text' }),
        new TableColumn({ name: 'display_order', type: 'integer', default: 0 }),
        new TableColumn({ name: 'is_active', type: 'boolean', default: true }),
        new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'deleted_at', type: dateType, isNullable: true }),
      ],
    }), true);
    await queryRunner.createUniqueConstraint('product_categories', new TableUnique({ columnNames: ['slug'] }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('product_categories')) await queryRunner.dropTable('product_categories');
  }
}
