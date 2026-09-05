import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique } from 'typeorm';

export class CreateUsersCustomers1710000002000 implements MigrationInterface {
  name = 'CreateUsersCustomers1710000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    if (!(await queryRunner.hasTable('users'))) {
      await queryRunner.createTable(new Table({ name: 'users', columns: [
        new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
        new TableColumn({ name: 'email', type: 'varchar', length: '255' }),
        new TableColumn({ name: 'password_hash', type: 'varchar', length: '255' }),
        new TableColumn({ name: 'first_name', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'last_name', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'phone', type: 'varchar', length: '20', isNullable: true }),
        new TableColumn({ name: 'company_name', type: 'varchar', length: '255', isNullable: true }),
        new TableColumn({ name: 'role', type: 'varchar', length: '50', default: "'customer'" }),
        new TableColumn({ name: 'is_active', type: 'boolean', default: true }),
        new TableColumn({ name: 'last_login_at', type: dateType, isNullable: true }),
        new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'deleted_at', type: dateType, isNullable: true }),
      ] }), true);
      await queryRunner.createUniqueConstraint('users', new TableUnique({ columnNames: ['email'] }));
    }
    if (!(await queryRunner.hasTable('customers'))) {
      await queryRunner.createTable(new Table({ name: 'customers', columns: [
        new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
        new TableColumn({ name: 'user_id', type: 'varchar' }),
        new TableColumn({ name: 'company_name', type: 'varchar', length: '255' }),
        new TableColumn({ name: 'company_registration_number', type: 'varchar', length: '50', isNullable: true }),
        new TableColumn({ name: 'company_website', type: 'varchar', length: '255', isNullable: true }),
        new TableColumn({ name: 'industry', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'country', type: 'varchar', length: '50', isNullable: true }),
        new TableColumn({ name: 'city', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'address', type: 'varchar', length: '500', isNullable: true }),
        new TableColumn({ name: 'phone', type: 'varchar', length: '20', isNullable: true }),
        new TableColumn({ name: 'contact_person', type: 'varchar', length: '100', isNullable: true }),
        new TableColumn({ name: 'payment_terms', type: 'varchar', length: '50', default: "'net_30'" }),
        new TableColumn({ name: 'credit_limit', type: 'integer', default: 0 }),
        new TableColumn({ name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }),
        new TableColumn({ name: 'is_verified', type: 'boolean', default: false }),
        new TableColumn({ name: 'notes', type: 'text', isNullable: true }),
        new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
        new TableColumn({ name: 'deleted_at', type: dateType, isNullable: true }),
      ] }), true);
      await queryRunner.createUniqueConstraint('customers', new TableUnique({ columnNames: ['user_id'] }));
      await queryRunner.createForeignKey('customers', new TableForeignKey({ columnNames: ['user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE' }));
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('customers')) await queryRunner.dropTable('customers');
    if (await queryRunner.hasTable('users')) await queryRunner.dropTable('users');
  }
}
