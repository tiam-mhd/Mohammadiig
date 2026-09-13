import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),
  HOST: Joi.string().default('0.0.0.0'),
  // Comma-separated origins allowed, e.g. https://mohammadiig.ir,https://www.mohammadiig.ir
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  JWT_SECRET: Joi.string().min(32).default('mig-development-secret-change-in-production-32'),
  DB_DRIVER: Joi.string().valid('better-sqlite3', 'sqlite', 'postgres').optional(),
  DATABASE_PATH: Joi.string().default('backend/data/mig.sqlite'),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).optional(),
  /** Absolute or relative path for uploaded media (must be on a persistent volume in production). */
  MEDIA_ROOT: Joi.string().default('./data/media'),
  /** Public origin for media URLs, e.g. https://api.mohammadiig.ir — leave empty for relative /media/... */
  MEDIA_PUBLIC_BASE_URL: Joi.string().allow('').default(''),
  ADMIN_EMAIL: Joi.string().email().default('admin@mohammadiig.ir'),
  ADMIN_PASSWORD: Joi.string().min(8).max(128).default('MigAdmin2026!'),
  ADMIN_FIRST_NAME: Joi.string().min(1).max(100).default('MIG'),
  ADMIN_LAST_NAME: Joi.string().min(1).max(100).default('Admin'),
}).custom((value, helpers) => {
  const driver = (value.DB_DRIVER ?? '').toLowerCase();
  const hasPostgresUrl = Boolean(value.DATABASE_URL);
  const usePostgres = driver === 'postgres' || hasPostgresUrl;

  if (usePostgres && !value.DATABASE_URL) {
    return helpers.error('any.custom', {
      message: 'DATABASE_URL is required when using Postgres (DB_DRIVER=postgres or a postgres DATABASE_URL)',
    });
  }

  return {
    ...value,
    DB_DRIVER: usePostgres ? 'postgres' : driver || 'better-sqlite3',
  };
});
