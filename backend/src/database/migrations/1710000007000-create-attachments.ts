import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAttachments1710000007000 implements MigrationInterface {
  name = 'CreateAttachments1710000007000';
  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('attachments')) return;
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    await queryRunner.createTable(new Table({ name: 'attachments', columns: [
      { name: 'id', type: 'varchar', isPrimary: true }, { name: 'owner_type', type: 'varchar', length: '50' }, { name: 'owner_id', type: 'varchar', length: '100' }, { name: 'file_name', type: 'varchar', length: '255' }, { name: 'file_url', type: 'varchar', length: '500' }, { name: 'file_size', type: 'integer', isNullable: true }, { name: 'file_type', type: 'varchar', length: '50', isNullable: true }, { name: 'uploaded_by', type: 'varchar', length: '100' }, { name: 'uploaded_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'deleted_at', type: dateType, isNullable: true },
    ] }), true);
  }
  async down(queryRunner: QueryRunner): Promise<void> { if (await queryRunner.hasTable('attachments')) await queryRunner.dropTable('attachments'); }
}
