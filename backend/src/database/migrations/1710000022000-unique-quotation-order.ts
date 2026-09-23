import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class UniqueQuotationOrder1710000022000 implements MigrationInterface {
  name = 'UniqueQuotationOrder1710000022000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates: unknown[] = await queryRunner.query(
      'SELECT reference_quotation_id FROM orders WHERE reference_quotation_id IS NOT NULL GROUP BY reference_quotation_id HAVING COUNT(*) > 1',
    );
    if (duplicates.length) {
      throw new Error('برای یک پیش‌فاکتور چند سفارش وجود دارد؛ پیش از اجرای Migration بررسی مالی لازم است. هیچ داده‌ای حذف نشد.');
    }
    await queryRunner.createIndex('orders', new TableIndex({
      name: 'uq_orders_reference_quotation', columnNames: ['reference_quotation_id'], isUnique: true,
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('orders', 'uq_orders_reference_quotation');
  }
}
