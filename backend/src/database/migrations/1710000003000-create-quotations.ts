import { MigrationInterface, QueryRunner, Table, TableColumn, TableUnique } from 'typeorm';

export class CreateQuotations1710000003000 implements MigrationInterface {
  name = 'CreateQuotations1710000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('quotations')) return;
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    await queryRunner.createTable(new Table({ name: 'quotations', columns: [
      new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
      new TableColumn({ name: 'quotation_number', type: 'varchar', length: '50' }),
      new TableColumn({ name: 'customer_id', type: 'varchar', length: '100' }),
      new TableColumn({ name: 'quoted_by', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'valid_until', type: dateType }),
      new TableColumn({ name: 'items', type: 'text', default: "'[]'" }),
      new TableColumn({ name: 'subtotal', type: 'integer' }),
      new TableColumn({ name: 'tax_amount', type: 'integer', default: 0 }),
      new TableColumn({ name: 'tax_rate', type: 'integer', default: 0 }),
      new TableColumn({ name: 'discount_amount', type: 'integer', default: 0 }),
      new TableColumn({ name: 'total_amount', type: 'integer' }),
      new TableColumn({ name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }),
      new TableColumn({ name: 'status', type: 'varchar', length: '50', default: "'draft'" }),
      new TableColumn({ name: 'terms_and_conditions', type: 'text', isNullable: true }),
      new TableColumn({ name: 'notes', type: 'text', isNullable: true }),
      new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
      new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
      new TableColumn({ name: 'deleted_at', type: dateType, isNullable: true }),
    ] }), true);
    await queryRunner.createUniqueConstraint('quotations', new TableUnique({ columnNames: ['quotation_number'] }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('quotations')) await queryRunner.dropTable('quotations');
  }
}
