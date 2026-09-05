import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOrderCustomizations1710000009000 implements MigrationInterface {
  name = 'CreateOrderCustomizations1710000009000';
  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('order_customizations')) return;
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    await queryRunner.createTable(new Table({ name: 'order_customizations', columns: [
      { name: 'id', type: 'varchar', isPrimary: true }, { name: 'order_item_id', type: 'varchar', length: '100' }, { name: 'customization_type', type: 'varchar', length: '50' }, { name: 'customization_name_fa', type: 'varchar', length: '100', isNullable: true }, { name: 'customization_value', type: 'varchar', length: '255' }, { name: 'additional_cost', type: 'integer', default: 0 }, { name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }, { name: 'is_approved', type: 'boolean', default: false }, { name: 'notes', type: 'text', isNullable: true }, { name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' },
    ] }), true);
  }
  async down(queryRunner: QueryRunner): Promise<void> { if (await queryRunner.hasTable('order_customizations')) await queryRunner.dropTable('order_customizations'); }
}
