import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from './database.options';
import { ProductEntity } from './products/product.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDatabaseOptions(),
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('[DB] TypeORM options are missing');
        }
        const dataSource = new DataSource(options);
        try {
          await dataSource.initialize();
          const executed = await dataSource.query(
            `SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`,
          ).catch(async () => {
            // SQLite fallback
            const rows = await dataSource.query(
              `SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
            );
            return rows;
          });
          const tableCount = Number(executed?.[0]?.count ?? executed?.[0]?.COUNT ?? 0);
          console.log(
            `[DB] connected type=${options.type} migrationsRegistered=${dataSource.migrations.length} publicTables=${tableCount}`,
          );
          return dataSource;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[DB] initialize/migrations FAILED: ${message}`);
          throw error;
        }
      },
    }),
    TypeOrmModule.forFeature([ProductEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
