import { MigrationInterface, QueryRunner, Table, TableColumn, TableUnique } from 'typeorm';

export class CreateSparePartCategories1710000010000 implements MigrationInterface {
  name = 'CreateSparePartCategories1710000010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';

    if (!(await queryRunner.hasTable('spare_part_categories'))) {
      await queryRunner.createTable(
        new Table({
          name: 'spare_part_categories',
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
        }),
        true,
      );
      await queryRunner.createUniqueConstraint(
        'spare_part_categories',
        new TableUnique({ columnNames: ['slug'] }),
      );
    }

    if (await queryRunner.hasTable('spare_parts')) {
      const table = await queryRunner.getTable('spare_parts');
      if (table && !table.findColumnByName('category')) {
        await queryRunner.addColumn(
          'spare_parts',
          new TableColumn({
            name: 'category',
            type: 'varchar',
            length: '100',
            default: "''",
          }),
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('spare_parts')) {
      const table = await queryRunner.getTable('spare_parts');
      if (table?.findColumnByName('category')) {
        await queryRunner.dropColumn('spare_parts', 'category');
      }
    }
    if (await queryRunner.hasTable('spare_part_categories')) {
      await queryRunner.dropTable('spare_part_categories');
    }
  }
}
