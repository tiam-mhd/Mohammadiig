import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ProductGallery1710000013000 implements MigrationInterface {
  name = 'ProductGallery1710000013000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('products', 'gallery')) return;
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'gallery',
        type: 'text',
        default: "'[]'",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('products', 'gallery')) {
      await queryRunner.dropColumn('products', 'gallery');
    }
  }
}
