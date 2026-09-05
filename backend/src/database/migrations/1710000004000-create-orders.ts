import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique } from 'typeorm';

export class CreateOrders1710000004000 implements MigrationInterface {
  name = 'CreateOrders1710000004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    if (!(await queryRunner.hasTable('orders'))) {
      await queryRunner.createTable(new Table({ name: 'orders', columns: [
        new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
        new TableColumn({ name: 'order_number', type: 'varchar', length: '50' }),
        new TableColumn({ name: 'customer_id', type: 'varchar', length: '100' }),
        new TableColumn({ name: 'created_by', type: 'varchar', length: '100' }),
        new TableColumn({ name: 'status', type: 'varchar', length: '50', default: "'pending'" }),
        new TableColumn({ name: 'order_type', type: 'varchar', length: '50', default: "'custom'" }),
        new TableColumn({ name: 'shipping_address', type: 'text', default: "'{}'" }),
        new TableColumn({ name: 'billing_address', type: 'text', default: "'{}'" }),
        new TableColumn({ name: 'subtotal', type: 'integer' }),
        new TableColumn({ name: 'tax_amount', type: 'integer', default: 0 }),
        new TableColumn({ name: 'shipping_cost', type: 'integer', default: 0 }),
        new TableColumn({ name: 'discount_amount', type: 'integer', default: 0 }),
        new TableColumn({ name: 'total_amount', type: 'integer' }),
        new TableColumn({ name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }),
        new TableColumn({ name: 'payment_status', type: 'varchar', length: '50', default: "'unpaid'" }),
        new TableColumn({ name: 'reference_quotation_id', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'notes', type: 'text', isNullable: true }),
        new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'deleted_at', type: dateType, isNullable: true }),
      ] }), true);
      await queryRunner.createUniqueConstraint('orders', new TableUnique({ columnNames: ['order_number'] }));
    }
    if (!(await queryRunner.hasTable('order_items'))) {
      await queryRunner.createTable(new Table({ name: 'order_items', columns: [
        new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
        new TableColumn({ name: 'order_id', type: 'varchar', length: '100' }),
        new TableColumn({ name: 'product_id', type: 'varchar', length: '100' }),
        new TableColumn({ name: 'quantity', type: 'integer' }),
        new TableColumn({ name: 'unit_price', type: 'integer' }),
        new TableColumn({ name: 'line_total', type: 'integer' }),
        new TableColumn({ name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }),
        new TableColumn({ name: 'customizations_json', type: 'text', default: "'{}'" }),
        new TableColumn({ name: 'status', type: 'varchar', length: '50', default: "'pending'" }),
        new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
      ] }), true);
      await queryRunner.createForeignKey('order_items', new TableForeignKey({ columnNames: ['order_id'], referencedTableName: 'orders', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('order_items')) await queryRunner.dropTable('order_items');
    if (await queryRunner.hasTable('orders')) await queryRunner.dropTable('orders');
  }
}
