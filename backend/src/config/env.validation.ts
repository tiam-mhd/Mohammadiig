import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),
  HOST: Joi.string().default('0.0.0.0'),
  // Comma-separated origins allowed, e.g. https://mohammadiig.ir,https://www.mohammadiig.ir
  FRONTEND_URL: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required(), otherwise: Joi.when('NODE_ENV', { is: 'development', then: Joi.string().default('http://localhost:3000'), otherwise: Joi.required() }) }),
  JWT_SECRET: Joi.string().min(32).when('NODE_ENV', { is: 'development', then: Joi.string().default('mig-development-secret-change-in-production-32'), otherwise: Joi.required() }),
  DB_DRIVER: Joi.string().valid('better-sqlite3', 'sqlite', 'postgres').optional(),
  DATABASE_PATH: Joi.string().default('backend/data/mig.sqlite'),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).optional(),
  /** Absolute or relative path for uploaded media (must be on a persistent volume in production). */
  MEDIA_ROOT: Joi.string().default('./data/media'),
  /** Public origin for media URLs, e.g. https://api.mohammadiig.ir — leave empty for relative /media/... */
  MEDIA_PUBLIC_BASE_URL: Joi.string().allow('').default(''),
  ADMIN_EMAIL: Joi.string().email().when('NODE_ENV', { is: 'development', then: Joi.string().default('admin@mohammadiig.ir'), otherwise: Joi.required() }),
  ADMIN_PASSWORD: Joi.string().min(8).max(128).when('NODE_ENV', { is: 'development', then: Joi.string().default('MigAdmin2026!'), otherwise: Joi.required() }),
  ADMIN_FIRST_NAME: Joi.string().min(1).max(100).default('MIG'),
  ADMIN_LAST_NAME: Joi.string().min(1).max(100).default('Admin'),
  /** Parsgreen REST Apiv2 key (panel → وب سرویس → کلید). */
  PARSGREEN_API_KEY: Joi.string().allow('').default(''),
  /** Append brand name to OTP SMS when configured in Parsgreen panel. */
  PARSGREEN_ADD_NAME: Joi.string().valid('true', 'false').default('true'),
  /** Skip live SMS and log code (local/dev). */
  PARSGREEN_DRY_RUN: Joi.string().valid('true', 'false').default('false'),
  /** Include debugCode in OTP send response (never enable in production). */
  PARSGREEN_DEBUG: Joi.string().valid('true', 'false').default('false'),
  OTP_TTL_SECONDS: Joi.number().integer().min(60).max(600).default(120),
  OTP_RESEND_SECONDS: Joi.number().integer().min(30).max(300).default(60),
  OTP_STEP_TOKEN_SECONDS: Joi.number().integer().min(60).max(1800).default(600),
  OTP_LENGTH: Joi.number().integer().min(4).max(8).default(5),
}).custom((value, helpers) => {
  const driver = (value.DB_DRIVER ?? '').toLowerCase();
  const hasPostgresUrl = Boolean(value.DATABASE_URL);
  const usePostgres = driver === 'postgres' || hasPostgresUrl;

  if (usePostgres && !value.DATABASE_URL) {
    return helpers.error('any.custom', {
      message: 'برای اتصال به PostgreSQL تنظیم DATABASE_URL الزامی است.',
    });
  }

  if (value.NODE_ENV === 'production') {
    const reject = (message: string) => helpers.message({ custom: message });
    if (!usePostgres || !value.DATABASE_URL) return reject('در محیط عملیاتی اتصال PostgreSQL الزامی است.');
    if (driver && driver !== 'postgres') return reject('در محیط عملیاتی DB_DRIVER باید postgres باشد.');
    if (/development|replace-with|change-in-production|use-a-unique/i.test(value.JWT_SECRET)) {
      return reject('کلید JWT محیط عملیاتی باید مستقل و تصادفی باشد.');
    }
    if (value.ADMIN_PASSWORD.length < 12 || /MigAdmin2026|change-me/i.test(value.ADMIN_PASSWORD)) {
      return reject('رمز مدیر محیط عملیاتی باید مستقل و حداقل ۱۲ نویسه باشد.');
    }
    if (!value.PARSGREEN_API_KEY?.trim()) return reject('کلید سرویس پیامک در محیط عملیاتی الزامی است.');
    if (value.PARSGREEN_DRY_RUN !== 'false' || value.PARSGREEN_DEBUG !== 'false') {
      return reject('حالت آزمایشی و نمایش کد پیامک در محیط عملیاتی مجاز نیست.');
    }
    const origins = value.FRONTEND_URL.split(',');
    if (origins.some((origin: string) => {
      try {
        const url = new URL(origin.trim());
        return url.protocol !== 'https:' || url.origin !== origin.trim() || Boolean(url.username || url.password) ||
          ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.hostname.includes('*');
      } catch { return true; }
    })) return reject('مبدأهای CORS باید نشانی دقیق HTTPS و بدون مسیر یا wildcard باشند.');
  }

  return {
    ...value,
    DB_DRIVER: usePostgres ? 'postgres' : driver || 'better-sqlite3',
  };
}).messages({
  'any.required': 'تنظیم {{#label}} الزامی است.',
  'any.only': 'مقدار تنظیم {{#label}} مجاز نیست.',
  'string.empty': 'تنظیم {{#label}} نباید خالی باشد.',
  'string.min': 'طول تنظیم {{#label}} کافی نیست.',
  'string.max': 'طول تنظیم {{#label}} بیش از حد مجاز است.',
  'string.email': 'نشانی ایمیل تنظیم {{#label}} معتبر نیست.',
  'string.uriCustomScheme': 'نشانی تنظیم {{#label}} معتبر نیست.',
  'any.custom': '{{#message}}',
});
