-- Run this in Runflare Postgres console / psql (inside the cluster)
INSERT INTO users (
  id, email, password_hash, first_name, last_name, phone, company_name,
  role, is_active, last_login_at, created_at, updated_at
) VALUES (
  'b462d76f-12d8-43ce-8246-5f9c6d5d2e33',
  'admin@mohammadiig.ir',
  '$2b$12$T45CM9cOjafsxFXQWz/5.O4pRCCRdvSr9iQNIEimzrQog4bnxT./C',
  'Admin',
  'MIG',
  NULL,
  'MIG',
  'admin',
  true,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'admin',
  is_active = true,
  deleted_at = NULL,
  updated_at = NOW();
