import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMediaLibrary1710000012000 implements MigrationInterface {
  name = 'CreateMediaLibrary1710000012000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('media_assets')) return;
    const dateType = queryRunner.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    await queryRunner.createTable(
      new Table({
        name: 'media_assets',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'original_name', type: 'varchar', length: '255' },
          { name: 'stored_name', type: 'varchar', length: '255' },
          { name: 'relative_path', type: 'varchar', length: '500' },
          { name: 'url', type: 'varchar', length: '700' },
          { name: 'mime_type', type: 'varchar', length: '120' },
          { name: 'file_size', type: 'integer' },
          { name: 'width', type: 'integer', isNullable: true },
          { name: 'height', type: 'integer', isNullable: true },
          { name: 'folder', type: 'varchar', length: '120', default: "'general'" },
          { name: 'alt_text', type: 'varchar', length: '300', isNullable: true },
          { name: 'title', type: 'varchar', length: '255', isNullable: true },
          { name: 'caption', type: 'varchar', length: '500', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'checksum', type: 'varchar', length: '64', isNullable: true },
          { name: 'parent_id', type: 'varchar', length: '100', isNullable: true },
          { name: 'uploaded_by', type: 'varchar', length: '100' },
          { name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: dateType, default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: dateType, isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'media_assets',
      new TableIndex({ name: 'IDX_media_assets_folder', columnNames: ['folder'] }),
    );
    await queryRunner.createIndex(
      'media_assets',
      new TableIndex({ name: 'IDX_media_assets_checksum', columnNames: ['checksum'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('media_assets')) {
      await queryRunner.dropTable('media_assets');
    }
  }
}
