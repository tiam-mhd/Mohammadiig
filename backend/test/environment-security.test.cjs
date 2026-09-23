require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { ConfigService } = require('@nestjs/config');
const { environmentValidationSchema } = require('../dist/config/env.validation');
const { ParsgreenSmsService } = require('../dist/sms/parsgreen-sms.service');

function production() {
  return {
    NODE_ENV: 'production', JWT_SECRET: randomBytes(48).toString('hex'),
    ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: randomBytes(24).toString('hex'),
    DB_DRIVER: 'postgres', DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    FRONTEND_URL: 'https://example.test', PARSGREEN_API_KEY: 'test-only-key',
  };
}

test('production accepts explicitly configured environment', () => {
  assert.equal(environmentValidationSchema.validate(production()).error, undefined);
});
for (const field of ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'DATABASE_URL', 'FRONTEND_URL', 'PARSGREEN_API_KEY']) {
  test(`production requires ${field}`, () => {
    const env = production(); delete env[field];
    assert.ok(environmentValidationSchema.validate(env).error);
  });
}
for (const [field, value] of [
  ['JWT_SECRET', 'mig-development-secret-change-in-production-32'],
  ['ADMIN_PASSWORD', 'MigAdmin2026!'], ['PARSGREEN_DRY_RUN', 'true'], ['PARSGREEN_DEBUG', 'true'],
  ['DB_DRIVER', 'sqlite'], ['FRONTEND_URL', 'http://example.test'],
  ['FRONTEND_URL', 'https://example.test/path'], ['FRONTEND_URL', '*'],
  ['FRONTEND_URL', 'https://*.example.test'], ['FRONTEND_URL', 'https://localhost'],
]) {
  test(`production rejects unsafe ${field}: ${value}`, () => {
    assert.ok(environmentValidationSchema.validate({ ...production(), [field]: value }).error);
  });
}
test('development alone permits credential defaults', () => {
  assert.equal(environmentValidationSchema.validate({ NODE_ENV: 'development' }).error, undefined);
  assert.ok(environmentValidationSchema.validate({ NODE_ENV: 'test' }).error);
});
test('SMS production guard rejects missing key or dry-run before logging secrets', async () => {
  for (const options of [{}, { PARSGREEN_API_KEY: 'test-only-key', PARSGREEN_DRY_RUN: 'true' }]) {
    const service = new ParsgreenSmsService(new ConfigService({ NODE_ENV: 'production', ...options }));
    const logs = [];
    service.logger = { warn: (...args) => logs.push(args), error: (...args) => logs.push(args) };
    await assert.rejects(service.sendOtp('09120000000', '12345'), /پیکربندی/);
    assert.deepEqual(logs, []);
  }
});
