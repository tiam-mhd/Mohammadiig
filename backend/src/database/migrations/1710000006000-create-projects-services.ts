import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProjectsServices1710000006000 implements MigrationInterface {
  name = 'CreateProjectsServices1710000006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    if (!(await queryRunner.hasTable('projects'))) await queryRunner.createTable(new Table({ name: 'projects', columns: [
      { name: 'id', type: 'varchar', isPrimary: true }, { name: 'project_code', type: 'varchar', length: '50' }, { name: 'project_name', type: 'varchar', length: '200' }, { name: 'description', type: 'text' }, { name: 'customer_id', type: 'varchar', length: '100' }, { name: 'assigned_to', type: 'varchar', length: '100', isNullable: true }, { name: 'project_type', type: 'varchar', length: '50' }, { name: 'country', type: 'varchar', length: '50', isNullable: true }, { name: 'city', type: 'varchar', length: '100', isNullable: true }, { name: 'start_date', type: 'date' }, { name: 'expected_completion_date', type: 'date' }, { name: 'budget_total', type: 'integer' }, { name: 'budget_spent', type: 'integer', default: 0 }, { name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }, { name: 'mig_investment_percentage', type: 'integer', default: 0 }, { name: 'profit_sharing_percentage', type: 'integer', default: 0 }, { name: 'status', type: 'varchar', length: '50', default: "'planning'" }, { name: 'documents', type: 'text', default: "'[]'" }, { name: 'created_by', type: 'varchar', length: '100' }, { name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'deleted_at', type: dateType, isNullable: true },
    ] }), true);
    if (!(await queryRunner.hasTable('project_phases'))) await queryRunner.createTable(new Table({ name: 'project_phases', columns: [
      { name: 'id', type: 'varchar', isPrimary: true }, { name: 'project_id', type: 'varchar', length: '100' }, { name: 'phase_number', type: 'integer' }, { name: 'phase_name_en', type: 'varchar', length: '100' }, { name: 'phase_name_fa', type: 'varchar', length: '100' }, { name: 'description', type: 'text' }, { name: 'start_date', type: 'date' }, { name: 'end_date', type: 'date' }, { name: 'status', type: 'varchar', length: '50', default: "'pending'" }, { name: 'deliverables', type: 'text', default: "'[]'" }, { name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' },
    ] }), true);
    if (!(await queryRunner.hasTable('services'))) await queryRunner.createTable(new Table({ name: 'services', columns: [
      { name: 'id', type: 'varchar', isPrimary: true }, { name: 'name_en', type: 'varchar', length: '150' }, { name: 'name_fa', type: 'varchar', length: '150' }, { name: 'description', type: 'text' }, { name: 'service_category', type: 'varchar', length: '50' }, { name: 'base_price', type: 'integer' }, { name: 'currency', type: 'varchar', length: '3', default: "'IRR'" }, { name: 'unit_type', type: 'varchar', length: '50', default: "'fixed'" }, { name: 'is_active', type: 'boolean', default: true }, { name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' }, { name: 'deleted_at', type: dateType, isNullable: true },
    ] }), true);
  }

  async down(queryRunner: QueryRunner): Promise<void> { if (await queryRunner.hasTable('project_phases')) await queryRunner.dropTable('project_phases'); if (await queryRunner.hasTable('projects')) await queryRunner.dropTable('projects'); if (await queryRunner.hasTable('services')) await queryRunner.dropTable('services'); }
}
