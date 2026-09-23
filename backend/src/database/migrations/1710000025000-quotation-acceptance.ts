import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
export class QuotationAcceptance1710000025000 implements MigrationInterface {
  name = 'QuotationAcceptance1710000025000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.addColumns('quotations', [
      new TableColumn({ name: 'accepted_at', type: 'varchar', length: '40', isNullable: true }),
      new TableColumn({ name: 'accepted_by', type: 'varchar', length: '100', isNullable: true }),
    ]);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.dropColumn('quotations', 'accepted_by');
    await runner.dropColumn('quotations', 'accepted_at');
  }
}
