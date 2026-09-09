import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),
  HOST: Joi.string().default('0.0.0.0'),
  // Comma-separated origins allowed, e.g. https://mohammadiig.ir,https://www.mohammadiig.ir
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  JWT_SECRET: Joi.string().min(32).default('mig-development-secret-change-in-production-32'),
  DB_DRIVER: Joi.string().valid('better-sqlite3', 'sqlite', 'postgres').default('better-sqlite3'),
  DATABASE_PATH: Joi.string().default('backend/data/mig.sqlite'),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).when('DB_DRIVER', {
    is: 'postgres',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
