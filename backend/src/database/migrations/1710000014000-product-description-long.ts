import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ProductDescriptionLong1710000014000 implements MigrationInterface {
  name = 'ProductDescriptionLong1710000014000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('products', 'description_long_fa')) return;
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'description_long_fa',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('products', 'description_long_fa')) {
      await queryRunner.dropColumn('products', 'description_long_fa');
    }
  }
}
