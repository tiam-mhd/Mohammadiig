import { MigrationInterface, QueryRunner, Table, TableColumn, TableUnique } from 'typeorm';

export class CreateProducts1710000000000 implements MigrationInterface {
  name = 'CreateProducts1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('products')) return;
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
          new TableColumn({ name: 'sku', type: 'varchar', length: '50' }),
          new TableColumn({ name: 'name_en', type: 'varchar', length: '200' }),
          new TableColumn({ name: 'name_fa', type: 'varchar', length: '200' }),
          new TableColumn({ name: 'slug', type: 'varchar', length: '200' }),
          new TableColumn({ name: 'description_short_fa', type: 'varchar', length: '500' }),
          new TableColumn({ name: 'specifications', type: 'text', default: "'{}'" }),
          new TableColumn({ name: 'price_base', type: 'integer' }),
          new TableColumn({ name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }),
          new TableColumn({ name: 'category', type: 'varchar', length: '40' }),
          new TableColumn({ name: 'thumbnail_image_url', type: 'varchar', length: '500', isNullable: true }),
          new TableColumn({ name: 'is_active', type: 'boolean', default: true }),
          new TableColumn({ name: 'is_featured', type: 'boolean', default: false }),
          new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
          new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
          new TableColumn({ name: 'deleted_at', type: dateType, isNullable: true }),
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint('products', new TableUnique({ columnNames: ['sku'] }));
    await queryRunner.createUniqueConstraint('products', new TableUnique({ columnNames: ['slug'] }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('products')) {
      await queryRunner.dropTable('products');
    }
  }
}
