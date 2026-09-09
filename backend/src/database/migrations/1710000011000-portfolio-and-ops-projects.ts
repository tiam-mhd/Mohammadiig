import { MigrationInterface, QueryRunner, Table, TableColumn, TableUnique } from 'typeorm';

export class PortfolioAndOpsProjects1710000011000 implements MigrationInterface {
  name = 'PortfolioAndOpsProjects1710000011000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    const boolType = queryRunner.connection.options.type === 'postgres' ? 'boolean' : 'boolean';

    if (!(await queryRunner.hasTable('portfolio_works'))) {
      await queryRunner.createTable(
        new Table({
          name: 'portfolio_works',
          columns: [
            new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
            new TableColumn({ name: 'slug', type: 'varchar', length: '120' }),
            new TableColumn({ name: 'title_fa', type: 'varchar', length: '200' }),
            new TableColumn({ name: 'title_en', type: 'varchar', length: '200' }),
            new TableColumn({ name: 'summary_fa', type: 'text' }),
            new TableColumn({ name: 'description_fa', type: 'text' }),
            new TableColumn({ name: 'client_name', type: 'varchar', length: '200', isNullable: true }),
            new TableColumn({ name: 'work_category', type: 'varchar', length: '80', default: "'entertainment'" }),
            new TableColumn({ name: 'country', type: 'varchar', length: '80', isNullable: true }),
            new TableColumn({ name: 'province', type: 'varchar', length: '100', isNullable: true }),
            new TableColumn({ name: 'city', type: 'varchar', length: '100', isNullable: true }),
            new TableColumn({ name: 'location_detail', type: 'varchar', length: '500', isNullable: true }),
            new TableColumn({ name: 'start_date', type: 'date', isNullable: true }),
            new TableColumn({ name: 'end_date', type: 'date', isNullable: true }),
            new TableColumn({ name: 'cover_image_url', type: 'varchar', length: '500', isNullable: true }),
            new TableColumn({ name: 'gallery', type: 'text', default: "'[]'" }),
            new TableColumn({ name: 'highlights', type: 'text', default: "'[]'" }),
            new TableColumn({ name: 'area_or_capacity', type: 'varchar', length: '200', isNullable: true }),
            new TableColumn({ name: 'is_published', type: boolType, default: true }),
            new TableColumn({ name: 'is_featured', type: boolType, default: false }),
            new TableColumn({ name: 'display_order', type: 'integer', default: 0 }),
            new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
            new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
            new TableColumn({ name: 'deleted_at', type: dateType, isNullable: true }),
          ],
        }),
        true,
      );
      await queryRunner.createUniqueConstraint('portfolio_works', new TableUnique({ columnNames: ['slug'] }));
    }

    if (await queryRunner.hasTable('projects')) {
      const table = await queryRunner.getTable('projects');
      const addIfMissing = async (column: TableColumn) => {
        if (table && !table.findColumnByName(column.name)) {
          await queryRunner.addColumn('projects', column);
        }
      };

      await addIfMissing(new TableColumn({ name: 'name_en', type: 'varchar', length: '200', isNullable: true }));
      await addIfMissing(new TableColumn({ name: 'slug', type: 'varchar', length: '120', isNullable: true }));
      await addIfMissing(new TableColumn({ name: 'summary_fa', type: 'text', isNullable: true }));
      await addIfMissing(
        new TableColumn({ name: 'client_display_name', type: 'varchar', length: '200', isNullable: true }),
      );
      await addIfMissing(new TableColumn({ name: 'province', type: 'varchar', length: '100', isNullable: true }));
      await addIfMissing(
        new TableColumn({ name: 'location_detail', type: 'varchar', length: '500', isNullable: true }),
      );
      await addIfMissing(new TableColumn({ name: 'completion_date', type: 'date', isNullable: true }));
      await addIfMissing(
        new TableColumn({ name: 'cover_image_url', type: 'varchar', length: '500', isNullable: true }),
      );
      await addIfMissing(new TableColumn({ name: 'gallery', type: 'text', default: "'[]'" }));
      await addIfMissing(new TableColumn({ name: 'highlights', type: 'text', default: "'[]'" }));
      await addIfMissing(new TableColumn({ name: 'is_published', type: boolType, default: false }));

      // Make customer_id nullable (legacy)
      const customerCol = table?.findColumnByName('customer_id');
      if (customerCol && !customerCol.isNullable) {
        await queryRunner.changeColumn(
          'projects',
          'customer_id',
          new TableColumn({
            name: 'customer_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          }),
        );
      }

      const createdBy = table?.findColumnByName('created_by');
      if (createdBy && !createdBy.isNullable) {
        await queryRunner.changeColumn(
          'projects',
          'created_by',
          new TableColumn({
            name: 'created_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          }),
        );
      }

      const startDate = table?.findColumnByName('start_date');
      if (startDate && !startDate.isNullable) {
        await queryRunner.changeColumn(
          'projects',
          'start_date',
          new TableColumn({ name: 'start_date', type: 'date', isNullable: true }),
        );
      }

      const expected = table?.findColumnByName('expected_completion_date');
      if (expected && !expected.isNullable) {
        await queryRunner.changeColumn(
          'projects',
          'expected_completion_date',
          new TableColumn({ name: 'expected_completion_date', type: 'date', isNullable: true }),
        );
      }
    }

    if (await queryRunner.hasTable('services')) {
      const services = await queryRunner.getTable('services');
      const price = services?.findColumnByName('base_price');
      if (price && !price.isNullable) {
        await queryRunner.changeColumn(
          'services',
          'base_price',
          new TableColumn({ name: 'base_price', type: 'integer', isNullable: true }),
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('portfolio_works')) {
      await queryRunner.dropTable('portfolio_works');
    }
  }
}
