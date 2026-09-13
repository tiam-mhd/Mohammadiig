const { Client } = require('pg');
const { hash } = require('bcryptjs');
const { randomUUID } = require('crypto');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:p8pX4kETDxnbaB3omLTo@mohammadiig-database-vks-service:5432/mohammadwpj_db';
const email = (process.env.ADMIN_EMAIL || 'admin@mohammadiig.ir').trim().toLowerCase();
const plainPassword = process.env.ADMIN_PASSWORD || 'MigAdmin2026!';

async function main() {
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    console.log('CONNECTED');

    const passwordHash = await hash(plainPassword, 12);
    const existing = await client.query('SELECT id, email, role FROM users WHERE email = $1', [email]);

    if (existing.rows.length) {
      await client.query(
        `UPDATE users
         SET password_hash = $1,
             role = 'admin',
             is_active = true,
             deleted_at = NULL,
             updated_at = NOW()
         WHERE email = $2`,
        [passwordHash, email],
      );
      console.log('UPDATED existing user:', existing.rows[0].email);
    } else {
      const id = randomUUID();
      await client.query(
        `INSERT INTO users (
           id, email, password_hash, first_name, last_name, phone, company_name,
           role, is_active, last_login_at, created_at, updated_at
         ) VALUES (
           $1, $2, $3, 'Admin', 'MIG', NULL, 'MIG',
           'admin', true, NULL, NOW(), NOW()
         )`,
        [id, email, passwordHash],
      );
      console.log('INSERTED new admin:', email, id);
    }

    const check = await client.query(
      'SELECT email, role, is_active FROM users WHERE email = $1',
      [email],
    );
    console.log('RESULT', check.rows[0]);
    console.log('LOGIN_EMAIL', email);
    console.log('LOGIN_PASSWORD', plainPassword);
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error('ERROR', err.message);
  process.exit(1);
});
