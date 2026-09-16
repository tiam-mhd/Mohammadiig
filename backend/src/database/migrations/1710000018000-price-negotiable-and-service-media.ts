import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * - products / portfolio_works / services: price_negotiable
 * - portfolio_works: price_base
 * - services: cover_image_url + gallery
 */
export class PriceNegotiableAndServiceMedia1710000018000 implements MigrationInterface {
  name = 'PriceNegotiableAndServiceMedia1710000018000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('products')) {
      if (!(await queryRunner.hasColumn('products', 'price_negotiable'))) {
        await queryRunner.addColumn(
          'products',
          new TableColumn({
            name: 'price_negotiable',
            type: 'boolean',
            default: false,
          }),
        );
      }
    }

    if (await queryRunner.hasTable('portfolio_works')) {
      if (!(await queryRunner.hasColumn('portfolio_works', 'price_base'))) {
        await queryRunner.addColumn(
          'portfolio_works',
          new TableColumn({
            name: 'price_base',
            type: 'integer',
            isNullable: true,
          }),
        );
      }
      if (!(await queryRunner.hasColumn('portfolio_works', 'price_negotiable'))) {
        await queryRunner.addColumn(
          'portfolio_works',
          new TableColumn({
            name: 'price_negotiable',
            type: 'boolean',
            default: false,
          }),
        );
      }
    }

    if (await queryRunner.hasTable('services')) {
      if (!(await queryRunner.hasColumn('services', 'price_negotiable'))) {
        await queryRunner.addColumn(
          'services',
          new TableColumn({
            name: 'price_negotiable',
            type: 'boolean',
            default: false,
          }),
        );
      }
      if (!(await queryRunner.hasColumn('services', 'cover_image_url'))) {
        await queryRunner.addColumn(
          'services',
          new TableColumn({
            name: 'cover_image_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          }),
        );
      }
      if (!(await queryRunner.hasColumn('services', 'gallery'))) {
        await queryRunner.addColumn(
          'services',
          new TableColumn({
            name: 'gallery',
            type: 'text',
            default: "'[]'",
          }),
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('services')) {
      if (await queryRunner.hasColumn('services', 'gallery')) {
        await queryRunner.dropColumn('services', 'gallery');
      }
      if (await queryRunner.hasColumn('services', 'cover_image_url')) {
        await queryRunner.dropColumn('services', 'cover_image_url');
      }
      if (await queryRunner.hasColumn('services', 'price_negotiable')) {
        await queryRunner.dropColumn('services', 'price_negotiable');
      }
    }

    if (await queryRunner.hasTable('portfolio_works')) {
      if (await queryRunner.hasColumn('portfolio_works', 'price_negotiable')) {
        await queryRunner.dropColumn('portfolio_works', 'price_negotiable');
      }
      if (await queryRunner.hasColumn('portfolio_works', 'price_base')) {
        await queryRunner.dropColumn('portfolio_works', 'price_base');
      }
    }

    if (await queryRunner.hasTable('products')) {
      if (await queryRunner.hasColumn('products', 'price_negotiable')) {
        await queryRunner.dropColumn('products', 'price_negotiable');
      }
    }
  }
}
