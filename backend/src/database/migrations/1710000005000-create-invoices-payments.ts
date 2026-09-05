import { MigrationInterface, QueryRunner, Table, TableColumn, TableUnique } from 'typeorm';

export class CreateInvoicesPayments1710000005000 implements MigrationInterface {
  name = 'CreateInvoicesPayments1710000005000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    if (!(await queryRunner.hasTable('invoices'))) {
      await queryRunner.createTable(new Table({ name: 'invoices', columns: [
        new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
        new TableColumn({ name: 'invoice_number', type: 'varchar', length: '50' }),
        new TableColumn({ name: 'order_id', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'quotation_id', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'customer_id', type: 'varchar', length: '100' }),
        new TableColumn({ name: 'due_date', type: dateType }),
        new TableColumn({ name: 'total_before_tax', type: 'integer' }),
        new TableColumn({ name: 'tax_amount', type: 'integer', default: 0 }),
        new TableColumn({ name: 'total_after_tax', type: 'integer' }),
        new TableColumn({ name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }),
        new TableColumn({ name: 'payment_status', type: 'varchar', length: '50', default: "'pending'" }),
        new TableColumn({ name: 'notes', type: 'text', isNullable: true }),
        new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'deleted_at', type: dateType, isNullable: true }),
      ] }), true);
      await queryRunner.createUniqueConstraint('invoices', new TableUnique({ columnNames: ['invoice_number'] }));
    }
    if (!(await queryRunner.hasTable('payments'))) {
      await queryRunner.createTable(new Table({ name: 'payments', columns: [
        new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
        new TableColumn({ name: 'invoice_id', type: 'varchar', length: '100' }),
        new TableColumn({ name: 'order_id', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'amount', type: 'integer' }),
        new TableColumn({ name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }),
        new TableColumn({ name: 'payment_method', type: 'varchar', length: '50' }),
        new TableColumn({ name: 'transaction_id', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'payment_status', type: 'varchar', length: '50', default: "'pending'" }),
        new TableColumn({ name: 'notes', type: 'text', isNullable: true }),
        new TableColumn({ name: 'processed_by', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'payment_date', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
      ] }), true);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('payments')) await queryRunner.dropTable('payments');
    if (await queryRunner.hasTable('invoices')) await queryRunner.dropTable('invoices');
  }
}
