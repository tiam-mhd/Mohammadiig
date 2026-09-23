import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AuthSessions1710000024000 implements MigrationInterface {
  name = 'AuthSessions1710000024000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.createTable(new Table({ name: 'auth_sessions', columns: [
      { name: 'token_hash', type: 'varchar', length: '64', isPrimary: true },
      { name: 'user_id', type: 'varchar', length: '100' },
      { name: 'expires_at', type: 'varchar', length: '40' },
    ], indices: [
      { name: 'idx_auth_session_user', columnNames: ['user_id'] },
      { name: 'idx_auth_session_expiry', columnNames: ['expires_at'] },
    ] }));
  }
  async down(runner: QueryRunner): Promise<void> { await runner.dropTable('auth_sessions'); }
}
