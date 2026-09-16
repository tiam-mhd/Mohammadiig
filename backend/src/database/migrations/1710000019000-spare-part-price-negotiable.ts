import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class SparePartPriceNegotiable1710000019000 implements MigrationInterface {
  name = 'SparePartPriceNegotiable1710000019000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('spare_parts'))) return;
    if (await queryRunner.hasColumn('spare_parts', 'price_negotiable')) return;
    await queryRunner.addColumn(
      'spare_parts',
      new TableColumn({
        name: 'price_negotiable',
        type: 'boolean',
        default: false,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('spare_parts'))) return;
    if (await queryRunner.hasColumn('spare_parts', 'price_negotiable')) {
      await queryRunner.dropColumn('spare_parts', 'price_negotiable');
    }
  }
}
