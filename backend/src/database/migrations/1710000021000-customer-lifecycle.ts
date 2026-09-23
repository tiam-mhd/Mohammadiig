import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class CustomerLifecycle1710000021000 implements MigrationInterface {
  name = 'CustomerLifecycle1710000021000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('customers', [
      new TableColumn({ name: 'status', type: 'varchar', length: '30', default: "'active'" }),
      new TableColumn({ name: 'status_reason', type: 'varchar', length: '1000', isNullable: true }),
      new TableColumn({ name: 'status_changed_at', type: 'varchar', length: '40', isNullable: true }),
      new TableColumn({ name: 'status_changed_by', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'purged_at', type: 'varchar', length: '40', isNullable: true }),
    ]);
    // Preserve legacy blocks and do not accidentally activate pre-existing accounts.
    await queryRunner.query(`UPDATE customers SET status = 'inactive'
      WHERE user_id IN (SELECT id FROM users WHERE is_active = false OR deleted_at IS NOT NULL)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Do not lose the marker and accidentally expose anonymous tombstones after re-upgrade.
    const purged: Array<{ count: number | string }> = await queryRunner.query(
      'SELECT COUNT(*) AS count FROM customers WHERE purged_at IS NOT NULL',
    );
    if (Number(purged[0]?.count) > 0) throw new Error('Cannot roll back customer lifecycle after permanent anonymization.');
    await queryRunner.dropColumns('customers', ['status_reason', 'status_changed_at', 'status_changed_by', 'status', 'purged_at']);
  }
}
