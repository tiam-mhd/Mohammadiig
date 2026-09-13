import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex, TableUnique } from 'typeorm';

export class PhoneOtpAuth1710000015000 implements MigrationInterface {
  name = 'PhoneOtpAuth1710000015000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const dateType = isPostgres ? 'timestamp' : 'datetime';

    if (await queryRunner.hasTable('users')) {
      // SQLite cannot ALTER COLUMN easily — recreate nullable constraints via table rebuild when needed.
      if (isPostgres) {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`);
      } else {
        // better-sqlite3: TypeORM drop/add is awkward; use raw recreate only if columns are NOT NULL.
        // For SQLite we keep columns as-is and write empty-string/null via entity nullable flags;
        // TypeORM with synchronize:false still reads null if we store null.
        // Rebuild users table to allow null email/password_hash.
        await queryRunner.query('PRAGMA foreign_keys=OFF');
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS "users__otp_mig" (
            "id" varchar PRIMARY KEY NOT NULL,
            "email" varchar(255),
            "password_hash" varchar(255),
            "first_name" varchar(100),
            "last_name" varchar(100),
            "phone" varchar(20),
            "company_name" varchar(255),
            "role" varchar(50) NOT NULL DEFAULT ('customer'),
            "is_active" boolean NOT NULL DEFAULT (1),
            "last_login_at" varchar(40),
            "two_factor_enabled" boolean NOT NULL DEFAULT (0),
            "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
            "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
            "deleted_at" datetime
          )
        `);
        const hasTwoFactor = await queryRunner.hasColumn('users', 'two_factor_enabled');
        if (hasTwoFactor) {
          await queryRunner.query(`
            INSERT INTO "users__otp_mig"
              (id, email, password_hash, first_name, last_name, phone, company_name, role, is_active, last_login_at, two_factor_enabled, created_at, updated_at, deleted_at)
            SELECT id, email, password_hash, first_name, last_name, phone, company_name, role, is_active, last_login_at, two_factor_enabled, created_at, updated_at, deleted_at
            FROM "users"
          `);
        } else {
          await queryRunner.query(`
            INSERT INTO "users__otp_mig"
              (id, email, password_hash, first_name, last_name, phone, company_name, role, is_active, last_login_at, two_factor_enabled, created_at, updated_at, deleted_at)
            SELECT id, email, password_hash, first_name, last_name, phone, company_name, role, is_active, last_login_at, 0, created_at, updated_at, deleted_at
            FROM "users"
          `);
        }
        await queryRunner.query('DROP TABLE "users"');
        await queryRunner.query('ALTER TABLE "users__otp_mig" RENAME TO "users"');
        await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_email" ON "users" ("email") WHERE "email" IS NOT NULL');
        await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_phone" ON "users" ("phone") WHERE "phone" IS NOT NULL');
        await queryRunner.query('PRAGMA foreign_keys=ON');
      }

      if (isPostgres && !(await queryRunner.hasColumn('users', 'two_factor_enabled'))) {
        await queryRunner.addColumn(
          'users',
          new TableColumn({ name: 'two_factor_enabled', type: 'boolean', default: false, isNullable: false }),
        );
      }

      if (isPostgres) {
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_phone" ON "users" ("phone") WHERE "phone" IS NOT NULL`);
      }
    }

    if (await queryRunner.hasTable('customers') && (await queryRunner.hasColumn('customers', 'company_name'))) {
      if (isPostgres) {
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "company_name" DROP NOT NULL`);
      } else {
        await queryRunner.query('PRAGMA foreign_keys=OFF');
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS "customers__otp_mig" (
            "id" varchar PRIMARY KEY NOT NULL,
            "user_id" varchar NOT NULL,
            "company_name" varchar(255),
            "company_registration_number" varchar(50),
            "company_website" varchar(255),
            "industry" varchar(100),
            "country" varchar(50),
            "city" varchar(100),
            "address" varchar(500),
            "phone" varchar(20),
            "contact_person" varchar(100),
            "payment_terms" varchar(50) NOT NULL DEFAULT ('net_30'),
            "credit_limit" integer NOT NULL DEFAULT (0),
            "currency" varchar(3) NOT NULL DEFAULT ('IRR'),
            "is_verified" boolean NOT NULL DEFAULT (0),
            "notes" text,
            "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
            "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
            "deleted_at" datetime
          )
        `);
        await queryRunner.query(`
          INSERT INTO "customers__otp_mig"
          SELECT id, user_id, company_name, company_registration_number, company_website, industry, country, city, address, phone, contact_person, payment_terms, credit_limit, currency, is_verified, notes, created_at, updated_at, deleted_at
          FROM "customers"
        `);
        await queryRunner.query('DROP TABLE "customers"');
        await queryRunner.query('ALTER TABLE "customers__otp_mig" RENAME TO "customers"');
        await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "UQ_customers_user_id" ON "customers" ("user_id")');
        await queryRunner.query('PRAGMA foreign_keys=ON');
      }
    }

    if (!(await queryRunner.hasTable('otp_challenges'))) {
      await queryRunner.createTable(
        new Table({
          name: 'otp_challenges',
          columns: [
            new TableColumn({ name: 'id', type: 'varchar', isPrimary: true }),
            new TableColumn({ name: 'phone', type: 'varchar', length: '20' }),
            new TableColumn({ name: 'purpose', type: 'varchar', length: '40' }),
            new TableColumn({ name: 'code_hash', type: 'varchar', length: '255' }),
            new TableColumn({ name: 'attempts', type: 'integer', default: 0 }),
            new TableColumn({ name: 'max_attempts', type: 'integer', default: 5 }),
            new TableColumn({ name: 'expires_at', type: 'varchar', length: '40' }),
            new TableColumn({ name: 'resend_available_at', type: 'varchar', length: '40' }),
            new TableColumn({ name: 'consumed_at', type: 'varchar', length: '40', isNullable: true }),
            new TableColumn({ name: 'step_token', type: 'varchar', length: '80', isNullable: true }),
            new TableColumn({ name: 'step_token_expires_at', type: 'varchar', length: '40', isNullable: true }),
            new TableColumn({ name: 'meta', type: 'text', isNullable: true }),
            new TableColumn({ name: 'created_at', type: dateType, default: 'CURRENT_TIMESTAMP' }),
          ],
        }),
        true,
      );
      await queryRunner.createIndex(
        'otp_challenges',
        new TableIndex({ name: 'IDX_otp_challenges_phone', columnNames: ['phone'] }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('otp_challenges')) {
      await queryRunner.dropTable('otp_challenges');
    }
  }
}
