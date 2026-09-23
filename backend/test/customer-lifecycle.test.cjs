// Run after compilation: node --test test/customer-lifecycle.test.cjs
require('reflect-metadata');
const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { randomUUID } = require('node:crypto');
const { hash } = require('bcryptjs');
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const { ConfigModule } = require('@nestjs/config');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { DataSource } = require('typeorm');
const { JwtService } = require('@nestjs/jwt');
const { AuthModule } = require('../dist/auth/auth.module');
const { CustomersModule } = require('../dist/customers/customers.module');
const { UsersModule } = require('../dist/users/users.module');
const { OrdersModule } = require('../dist/orders/orders.module');
const { QuotationsModule } = require('../dist/quotations/quotations.module');
const { ProductsModule } = require('../dist/products/products.module');
const { InvoicesModule } = require('../dist/invoices/invoices.module');
const { PaymentsModule } = require('../dist/payments/payments.module');
const { UserEntity } = require('../dist/auth/user.entity');
const { CustomerEntity } = require('../dist/customers/customer.entity');
const { SparePartEntity } = require('../dist/products/spare-part.entity');
const { ParsgreenSmsService } = require('../dist/sms/parsgreen-sms.service');
const { ensureCustomerProfile } = require('../dist/customers/customer-profile');
const { buildDatabaseDataSourceOptions } = require('../dist/database.options');
const { OrderEntity } = require('../dist/orders/order.entity');
const { InvoiceEntity } = require('../dist/invoices/invoice.entity');
const { PaymentEntity } = require('../dist/payments/payment.entity');
const { OtpChallengeEntity } = require('../dist/auth/otp-challenge.entity');
const { CustomerLifecycle1710000021000 } = require('../dist/database/migrations/1710000021000-customer-lifecycle');

let app, db, jwt, base, adminToken, passwordHash, sequence = 0;
const codes = new Map();
const password = 'Regression-Test-Only-123!';

before(async () => {
  // Isolated in-memory DB, real migrations, fake SMS; never read project .env or send messages.
  process.env.DB_DRIVER = 'sqlite';
  process.env.DATABASE_URL = '';
  process.env.DATABASE_PATH = ':memory:';
  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({
        JWT_SECRET: 'customer-regression-test-secret-32-characters',
        ADMIN_EMAIL: 'admin@regression.test', ADMIN_PASSWORD: password,
      })] }),
      TypeOrmModule.forRoot({ ...buildDatabaseDataSourceOptions(), logging: false }),
      AuthModule, CustomersModule, UsersModule, OrdersModule, QuotationsModule, ProductsModule, InvoicesModule, PaymentsModule,
    ],
  }).overrideProvider(ParsgreenSmsService).useValue({
    sendOtp: async (phone, code) => { codes.set(phone, code); },
  }).compile();
  app = module.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
  db = module.get(DataSource);
  jwt = module.get(JwtService);
  passwordHash = await hash(password, 4);
  const admin = await db.getRepository(UserEntity).findOneByOrFail({ email: 'admin@regression.test' });
  adminToken = await tokenFor(admin);
});

after(async () => { if (app) await app.close(); });

async function tokenFor(user, extra = {}) {
  const token = jwt.sign({ userId: user.id, role: user.role, email: user.email, jti: randomUUID(), ...extra });
  await app.get(require('../dist/auth/session.service').SessionService).register(token, user.id);
  return token;
}

async function account(role = 'customer', profile = true) {
  sequence += 1;
  const user = await db.getRepository(UserEntity).save({
    id: randomUUID(), email: `user${sequence}@regression.test`,
    phone: `0912${String(sequence).padStart(7, '0')}`,
    firstName: 'Test', lastName: 'Customer', companyName: null,
    role, isActive: true, passwordHash, twoFactorEnabled: false,
  });
  const customer = profile ? await ensureCustomerProfile(db.getRepository(CustomerEntity), user) : null;
  return { user, customer, token: await tokenFor(user) };
}

async function request(path, token, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = { status: response.status, body: await response.json() };
  const session = response.headers.getSetCookie().find(value => value.startsWith('mig_session='));
  if (session && result.body.accessToken === 'cookie-session') result.body.accessToken = session.split(';')[0].slice('mig_session='.length);
  return result;
}

async function checkout(token) {
  const id = randomUUID();
  await db.getRepository(SparePartEntity).save({
    id, partNumber: id, nameEn: 'Test part', nameFa: 'قطعه آزمایشی', description: '',
    price: 1000, stockQuantity: 10, isActive: true,
  });
  return request('/orders/spare-parts/checkout', token, 'POST', {
    items: [{ sparePartId: id, quantity: 2 }],
    shippingAddress: { fullName: 'Test Customer', phone: '09121234567', city: 'تهران', address: 'آدرس آزمایشی مشتری' },
    payWithTestGateway: true,
  });
}

test('checkout repairs a missing profile for an already logged-in customer and keeps one profile', async () => {
  const { user, token } = await account('customer', false);
  const result = await checkout(token);
  assert.equal(result.status, 201, JSON.stringify(result.body));
  assert.equal(result.body.invoice.paymentStatus, 'paid');
  const profile = await request('/customers/me', token);
  assert.equal(profile.status, 200);
  assert.equal(result.body.order.customerId, profile.body.id);
  assert.equal(await db.getRepository(CustomerEntity).countBy({ userId: user.id }), 1);
});

test('an administrator can checkout without a pre-existing customer profile', async () => {
  const { token } = await account('admin', false);
  const result = await checkout(token);
  assert.equal(result.status, 201, JSON.stringify(result.body));
});

test('simultaneous profile requests create exactly one profile', async () => {
  const { user, token } = await account('customer', false);
  const results = await Promise.all(Array.from({ length: 4 }, () => request('/customers/me', token)));
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(new Set(results.map((r) => r.body.id)).size, 1);
  assert.equal(await db.getRepository(CustomerEntity).countBy({ userId: user.id }), 1);
});

test('users list excludes customers but retains staff, including inactive staff', async () => {
  const { user: customer } = await account();
  const { user: staff } = await account('support', false);
  await db.getRepository(UserEntity).update(staff.id, { isActive: false });
  const result = await request('/users/admin/all', adminToken);
  assert.equal(result.status, 200);
  assert.ok(result.body.every((u) => u.role !== 'customer'));
  assert.ok(result.body.some((u) => u.id === staff.id));
  assert.ok(!result.body.some((u) => u.id === customer.id));
});

test('deactivation revokes existing tokens and OTP access; admin can reactivate', async () => {
  const { user, customer, token } = await account();
  const path = `/customers/admin/${customer.id}/status`;
  assert.equal((await request(path, adminToken, 'PATCH', { isActive: false, isVerified: true })).status, 200);
  assert.equal((await request('/customers/me', token)).status, 403);
  assert.equal((await request('/auth/otp/send', null, 'POST', { phone: user.phone, purpose: 'login' })).status, 403);
  assert.equal((await checkout(token)).status, 403);
  assert.equal((await request(path, adminToken, 'PATCH', { isActive: true, isVerified: true })).status, 200);
  assert.equal((await request('/customers/me', token)).status, 200);
});

test('soft deletion hides customer by default, keeps history readable and prevents restoration', async () => {
  const { user, customer, token } = await account();
  const purchase = await checkout(token);
  assert.equal(purchase.status, 201);
  assert.equal((await request(`/customers/admin/${customer.id}`, adminToken, 'DELETE')).status, 200);
  const current = await request('/customers/admin/all', adminToken);
  const deleted = await request('/customers/admin/all?status=deleted', adminToken);
  assert.ok(!current.body.some((c) => c.id === customer.id));
  assert.ok(deleted.body.some((c) => c.id === customer.id && c.deletedAt && !c.isActive));
  assert.ok(deleted.body.every((c) => c.deletedAt));
  const detail = await request(`/customers/admin/${customer.id}/360`, adminToken);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.orders[0].id, purchase.body.order.id);
  assert.equal(detail.body.invoices[0].id, purchase.body.invoice.id);
  assert.equal(detail.body.payments.length, 1);
  assert.equal(detail.body.user.id, user.id);
  assert.ok(!('passwordHash' in detail.body.user));
  assert.equal((await request('/customers/me', token)).status, 403);
  assert.equal((await request(`/customers/admin/${customer.id}/status`, adminToken, 'PATCH', { isActive: true, isVerified: true })).status, 404);
  assert.equal((await request(`/customers/admin/${customer.id}/verify`, adminToken, 'PATCH', { isVerified: true })).status, 404);
  await assert.rejects(ensureCustomerProfile(db.getRepository(CustomerEntity), user), { status: 403 });
  assert.equal(await db.getRepository(CustomerEntity).count({ where: { userId: user.id }, withDeleted: true }), 1);
});

test('legacy deleted profiles cannot login even when their linked user is still active', async () => {
  const { user, customer, token } = await account();
  await db.getRepository(CustomerEntity).softDelete(customer.id);
  assert.equal((await request('/customers/me', token)).status, 403);
  assert.equal((await request('/auth/login', null, 'POST', { email: user.email, password })).status, 403);
  assert.equal((await request('/auth/otp/send', null, 'POST', { phone: user.phone, purpose: 'login' })).status, 403);
});

test('OTP login repairs missing profiles and cannot reactivate a user blocked after OTP send', async () => {
  const { user } = await account('customer', false);
  const sent = await request('/auth/otp/send', null, 'POST', { phone: user.phone, purpose: 'login' });
  assert.equal(sent.status, 200);
  const login = await request('/auth/otp/verify', null, 'POST', { challengeId: sent.body.challengeId, code: codes.get(user.phone) });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  assert.equal(login.body.nextStep, 'done');
  assert.equal((await request('/customers/me', login.body.accessToken)).status, 200);
  const blocked = await account();
  const challenge = await request('/auth/otp/send', null, 'POST', { phone: blocked.user.phone, purpose: 'login' });
  await db.getRepository(UserEntity).update(blocked.user.id, { isActive: false });
  const denied = await request('/auth/otp/verify', null, 'POST', { challengeId: challenge.body.challengeId, code: codes.get(blocked.user.phone) });
  assert.equal(denied.status, 403);
  assert.equal((await db.getRepository(UserEntity).findOneByOrFail({ id: blocked.user.id })).isActive, false);
});

test('admin endpoints enforce roles, validate status and reject malformed tokens', async () => {
  const { customer, token } = await account();
  assert.equal((await request('/customers/admin/all?status=deleted', token)).status, 403);
  assert.equal((await request(`/customers/admin/${customer.id}`, token, 'DELETE')).status, 403);
  assert.equal((await request('/customers/admin/all?status=invalid', adminToken)).status, 400);
  assert.equal((await request(`/customers/admin/${customer.id}/status`, adminToken, 'PATCH', { isActive: 'false', isVerified: true })).status, 400);
  assert.equal((await request('/customers/me', jwt.sign({ role: 'admin' }))).status, 401);
  assert.equal((await request('/customers/me', 'invalid-token')).status, 401);
  assert.equal((await request('/customers/me', null)).status, 401);
});

test('staff customer profiles cannot disable/delete staff accounts from customer management', async () => {
  const { user, customer } = await account('admin');
  assert.equal((await request(`/customers/admin/${customer.id}`, adminToken, 'DELETE')).status, 400);
  assert.equal((await request(`/customers/admin/${customer.id}/status`, adminToken, 'PATCH', { isActive: false, isVerified: true })).status, 400);
  assert.equal((await db.getRepository(UserEntity).findOneByOrFail({ id: user.id })).isActive, true);
});

test('administrator password login works and stale role claims cannot retain admin access', async () => {
  const login = await request('/auth/login', null, 'POST', { email: 'admin@regression.test', password });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  assert.equal((await request('/users/admin/all', login.body.accessToken)).status, 200);
  const { user, token } = await account('admin', false);
  await db.getRepository(UserEntity).update(user.id, { role: 'support' });
  assert.equal((await request('/customers/admin/all', token)).status, 403);
});

test('soft-deleted user and pending two-factor login cannot bypass account removal', async () => {
  const deleted = await account();
  await db.getRepository(UserEntity).softDelete(deleted.user.id);
  assert.equal((await request('/customers/me', deleted.token)).status, 401);
  assert.equal((await request('/auth/otp/send', null, 'POST', { phone: deleted.user.phone, purpose: 'login' })).status, 401);
  const pending = await account();
  await db.getRepository(UserEntity).update(pending.user.id, { twoFactorEnabled: true });
  const challenge = await request('/auth/otp/send', null, 'POST', { phone: pending.user.phone, purpose: 'login' });
  const verified = await request('/auth/otp/verify', null, 'POST', { challengeId: challenge.body.challengeId, code: codes.get(pending.user.phone) });
  assert.equal(verified.body.nextStep, 'password');
  await request(`/customers/admin/${pending.customer.id}`, adminToken, 'DELETE');
  const login = await request('/auth/login/password', null, 'POST', { passwordToken: verified.body.passwordToken, password });
  assert.equal(login.status, 403);
  assert.ok((await db.getRepository(CustomerEntity).findOne({ where: { id: pending.customer.id }, withDeleted: true })).deletedAt);
});

test('explicit customer states persist, revoke access and require a real block reason', async () => {
  const { customer, token, user } = await account();
  const path = `/customers/admin/${customer.id}/status`;
  for (const reason of [undefined, '', '   ']) {
    assert.equal((await request(path, adminToken, 'PATCH', { status: 'blocked', isVerified: false, reason })).status, 400);
  }
  for (const status of ['inactive', 'blocked', 'pending_review']) {
    const changed = await request(path, adminToken, 'PATCH', { status, isVerified: true, reason: '  نیاز به پیگیری مدیر  ' });
    assert.equal(changed.status, 200, JSON.stringify(changed.body));
    assert.equal(changed.body.status, status);
    assert.equal(changed.body.statusReason, 'نیاز به پیگیری مدیر');
    assert.equal(changed.body.isActive, false);
    assert.ok(changed.body.statusChangedAt);
    assert.equal(changed.body.statusChangedBy, jwt.decode(adminToken).userId);
    assert.equal((await request('/customers/me', token)).status, 403);
    const otp = await request('/auth/otp/send', null, 'POST', { phone: user.phone, purpose: 'login' });
    assert.equal(otp.status, 403);
    assert.ok(!JSON.stringify(otp.body).includes('نیاز به پیگیری مدیر'));
    // Legacy activation cannot bypass the authoritative customer status.
    await db.getRepository(UserEntity).update(user.id, { isActive: true });
    assert.equal((await request('/customers/me', token)).status, 403);
    const activated = await request(path, adminToken, 'PATCH', { status: 'active', isVerified: false, reason: '' });
    assert.equal(activated.status, 200);
    assert.equal(activated.body.statusReason, null);
    assert.equal((await request('/customers/me', token)).status, 200);
  }
});

test('status API rejects invalid transitions and private reasons stay out of self profile', async () => {
  const { customer, token } = await account();
  const path = `/customers/admin/${customer.id}/status`;
  for (const body of [
    { status: 'invalid', isVerified: true }, { isVerified: true },
    { status: 'blocked', isActive: true, isVerified: true, reason: 'reason' },
    { status: 'active', isVerified: true, reason: 'x'.repeat(1001) },
    { status: 'active', isVerified: 'false' },
  ]) assert.equal((await request(path, adminToken, 'PATCH', body)).status, 400);
  assert.equal((await request(path, token, 'PATCH', { status: 'active', isVerified: true })).status, 403);
  await request(path, adminToken, 'PATCH', { status: 'active', isVerified: true, reason: 'private staff note' });
  const profile = await request('/customers/me', token);
  assert.equal(profile.status, 200);
  assert.ok(!('statusReason' in profile.body));
  assert.ok(!('statusChangedBy' in profile.body));
  const detail = await request(`/customers/admin/${customer.id}/360`, adminToken);
  assert.equal(detail.body.customer.statusReason, 'private staff note');
});

test('permanent removal requires soft deletion, explicit confirmation and an administrator', async () => {
  const { customer, token } = await account();
  const path = `/customers/admin/${customer.id}/permanent`;
  const confirmed = { confirmation: 'حذف دائمی' };
  assert.equal((await request(path, adminToken, 'DELETE', confirmed)).status, 400);
  await request(`/customers/admin/${customer.id}`, adminToken, 'DELETE');
  const other = await account();
  assert.equal((await request(path, other.token, 'DELETE', confirmed)).status, 403);
  assert.equal((await request(path, null, 'DELETE', confirmed)).status, 401);
  assert.equal((await request(path, adminToken, 'DELETE', {})).status, 400);
  assert.equal((await request(path, adminToken, 'DELETE', { confirmation: 'yes' })).status, 400);
  assert.equal((await request(path, adminToken, 'DELETE', confirmed)).status, 200);
  assert.equal((await request(path, adminToken, 'DELETE', confirmed)).status, 404);
  assert.equal((await request('/customers/me', token)).status, 401);
});

test('permanent erasure scrubs identity and OTPs, retains finances and isolates other customers', async () => {
  const erased = await account();
  const other = await account();
  const purchase = await checkout(erased.token);
  const otherPurchase = await checkout(other.token);
  assert.equal(purchase.status, 201);
  assert.equal(otherPurchase.status, 201);
  await db.getRepository(CustomerEntity).update(erased.customer.id, {
    companyName: 'PRIVATE COMPANY', companyWebsite: 'https://private.test', companyRegistrationNumber: 'PRIVATE-123',
    country: 'IR', city: 'Private City', address: 'PRIVATE ADDRESS', industry: 'PRIVATE INDUSTRY',
    notes: 'PRIVATE NOTE', statusReason: 'PRIVATE REASON',
  });
  await db.getRepository(InvoiceEntity).update(purchase.body.invoice.id, { notes: 'PRIVATE INVOICE NOTE' });
  await db.getRepository(PaymentEntity).update(purchase.body.payment.id, { notes: 'PRIVATE PAYMENT NOTE' });
  await request('/auth/otp/send', null, 'POST', { phone: erased.user.phone, purpose: 'login' });
  const source = await db.getRepository(OtpChallengeEntity).findOneByOrFail({ phone: erased.user.phone });
  const newPhoneChallenge = await db.getRepository(OtpChallengeEntity).save({ ...source, id: randomUUID(), phone: '09300000000', purpose: 'change_mobile_new' });
  await request('/auth/otp/send', null, 'POST', { phone: other.user.phone, purpose: 'login' });
  // Include soft-deleted financial rows in the erasure.
  await db.getRepository(InvoiceEntity).softDelete(purchase.body.invoice.id);
  await db.getRepository(OrderEntity).softDelete(purchase.body.order.id);
  await request(`/customers/admin/${erased.customer.id}`, adminToken, 'DELETE');
  const result = await request(`/customers/admin/${erased.customer.id}/permanent`, adminToken, 'DELETE', { confirmation: 'حذف دائمی' });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  const customer = await db.getRepository(CustomerEntity).findOne({ where: { id: erased.customer.id }, withDeleted: true });
  const user = await db.getRepository(UserEntity).findOne({ where: { id: erased.user.id }, withDeleted: true });
  assert.ok(customer.purgedAt && customer.deletedAt);
  for (const field of ['companyName', 'companyWebsite', 'companyRegistrationNumber', 'contactPerson', 'phone', 'city', 'country', 'address', 'industry', 'notes', 'statusReason']) assert.equal(customer[field], null, field);
  for (const field of ['email', 'phone', 'passwordHash', 'firstName', 'lastName', 'companyName', 'lastLoginAt']) assert.equal(user[field], null, field);
  assert.ok(user.deletedAt);
  assert.equal(user.isActive, false);
  assert.equal(await db.getRepository(OtpChallengeEntity).countBy({ phone: erased.user.phone }), 0);
  assert.equal(await db.getRepository(OtpChallengeEntity).countBy({ id: newPhoneChallenge.id }), 0);
  assert.equal(await db.getRepository(OtpChallengeEntity).countBy({ phone: other.user.phone }), 1);
  const invoice = await db.getRepository(InvoiceEntity).findOne({ where: { id: purchase.body.invoice.id }, withDeleted: true });
  const order = await db.getRepository(OrderEntity).findOne({ where: { id: purchase.body.order.id }, withDeleted: true });
  const payment = await db.getRepository(PaymentEntity).findOneByOrFail({ id: purchase.body.payment.id });
  assert.equal(invoice.totalAfterTax, purchase.body.invoice.totalAfterTax);
  assert.equal(payment.amount, purchase.body.payment.amount);
  assert.equal(payment.transactionId, purchase.body.payment.transactionId);
  assert.deepEqual(invoice.lineItemsJson, purchase.body.invoice.lineItemsJson);
  assert.deepEqual(invoice.customerSnapshotJson, { customerId: customer.id, contactPerson: 'مشتری حذف‌شده' });
  assert.deepEqual(invoice.shippingSnapshotJson, {});
  assert.deepEqual(invoice.billingSnapshotJson, {});
  assert.deepEqual(order.shippingAddress, {});
  assert.deepEqual(order.billingAddress, {});
  assert.equal(invoice.notes, null);
  assert.equal(payment.notes, null);
  assert.equal((await request(`/customers/admin/${customer.id}/360`, adminToken)).status, 404);
  for (const suffix of ['', '?status=deleted']) {
    const list = await request(`/customers/admin/all${suffix}`, adminToken);
    assert.ok(!list.body.some((c) => c.id === customer.id));
  }
  const untouched = await db.getRepository(InvoiceEntity).findOneByOrFail({ id: otherPurchase.body.invoice.id });
  assert.deepEqual(untouched.customerSnapshotJson, otherPurchase.body.invoice.customerSnapshotJson);
  // A new account can reuse released contact details, without acquiring old purchases.
  const replacement = await db.getRepository(UserEntity).save({ ...other.user, id: randomUUID(), phone: erased.user.phone, email: erased.user.email });
  const replacementProfile = await ensureCustomerProfile(db.getRepository(CustomerEntity), replacement);
  assert.notEqual(replacementProfile.id, customer.id);
  assert.deepEqual((await request('/orders/mine', await tokenFor(replacement))).body, []);
});

test('a failure while erasing rolls the entire customer and financial mutation back', async () => {
  const { user, customer, token } = await account();
  const purchase = await checkout(token);
  await request(`/customers/admin/${customer.id}`, adminToken, 'DELETE');
  await db.query(`CREATE TRIGGER reject_test_purge BEFORE UPDATE ON users
    WHEN OLD.id = '${user.id}' AND NEW.email IS NULL
    BEGIN SELECT RAISE(ABORT, 'test erasure failure'); END`);
  try {
    const result = await request(`/customers/admin/${customer.id}/permanent`, adminToken, 'DELETE', { confirmation: 'حذف دائمی' });
    assert.equal(result.status, 500);
    const retained = await db.getRepository(CustomerEntity).findOne({ where: { id: customer.id }, withDeleted: true });
    assert.equal(retained.purgedAt, null);
    assert.equal(retained.phone, user.phone);
    const invoice = await db.getRepository(InvoiceEntity).findOneByOrFail({ id: purchase.body.invoice.id });
    assert.deepEqual(invoice.customerSnapshotJson, purchase.body.invoice.customerSnapshotJson);
  } finally {
    await db.query('DROP TRIGGER reject_test_purge');
  }
});

test('permanent removal never erases staff and deleted accounts cannot change status', async () => {
  const staff = await account('admin');
  await db.getRepository(CustomerEntity).softDelete(staff.customer.id);
  const result = await request(`/customers/admin/${staff.customer.id}/permanent`, adminToken, 'DELETE', { confirmation: 'حذف دائمی' });
  assert.equal(result.status, 400);
  assert.equal((await db.getRepository(UserEntity).findOneByOrFail({ id: staff.user.id })).email, staff.user.email);
  const customer = await account();
  await request(`/customers/admin/${customer.customer.id}`, adminToken, 'DELETE');
  assert.equal((await request(`/customers/admin/${customer.customer.id}/status`, adminToken, 'PATCH', { status: 'active', isVerified: true })).status, 404);
});

test('migration backfills inactive customers and cannot roll back an erasure marker', async () => {
  const options = buildDatabaseDataSourceOptions();
  const lifecycleIndex = options.migrations.indexOf(CustomerLifecycle1710000021000);
  assert.ok(lifecycleIndex >= 0);
  const isolated = new DataSource({ ...options, migrations: options.migrations.slice(0, lifecycleIndex), logging: false });
  await isolated.initialize();
  try {
    await isolated.query("INSERT INTO users (id, is_active) VALUES ('legacy-inactive', false), ('legacy-active', true)");
    await isolated.query("INSERT INTO customers (id, user_id) VALUES ('c-inactive', 'legacy-inactive'), ('c-active', 'legacy-active')");
    const runner = isolated.createQueryRunner();
    const migration = new CustomerLifecycle1710000021000();
    await migration.up(runner);
    const rows = await isolated.query('SELECT id, status FROM customers ORDER BY id');
    assert.deepEqual(rows, [{ id: 'c-active', status: 'active' }, { id: 'c-inactive', status: 'inactive' }]);
    await migration.down(runner);
    await migration.up(runner);
    await isolated.query("UPDATE customers SET purged_at = '2026-09-23T00:00:00.000Z' WHERE id = 'c-inactive'");
    await assert.rejects(migration.down(runner), /Cannot roll back/);
    await runner.release();
  } finally {
    await isolated.destroy();
  }
});

test('HttpOnly login, CSRF protection and logout revoke the actual credential', async () => {
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@regression.test', password }) });
  assert.equal(login.status, 200);
  const payload = await login.json();
  assert.equal(payload.accessToken, 'cookie-session');
  const setCookie = login.headers.getSetCookie().find(value => value.startsWith('mig_session='));
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  const cookie = setCookie.split(';')[0];
  const token = cookie.slice('mig_session='.length);
  assert.equal((await fetch(`${base}/auth/session`, { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Cookie: cookie } })).status, 403);
  assert.equal((await fetch(`${base}/auth/logout`, { method: 'POST', headers: {
    Cookie: cookie, 'X-Mig-Csrf': '1', Origin: 'https://attacker.example',
  } })).status, 403);
  const logout = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Cookie: cookie, 'X-Mig-Csrf': '1' } });
  assert.equal(logout.status, 200);
  assert.equal((await fetch(`${base}/auth/session`, { headers: { Cookie: cookie } })).status, 401);
  assert.equal((await request('/users/admin/all', token)).status, 401);
  const unregistered = jwt.sign({ userId: payload.user.id, role: 'admin' });
  assert.equal((await request('/users/admin/all', unregistered)).status, 401);
});

test('HTTP end-to-end: registration, OTP login, quotation, order, invoice and approved payment', async () => {
  const phone = '09359999991';
  const send = await request('/auth/otp/send', null, 'POST', { phone, purpose: 'register' });
  assert.equal(send.status, 200, JSON.stringify(send.body));
  const verify = await request('/auth/otp/verify', null, 'POST', { challengeId: send.body.challengeId, code: codes.get(phone) });
  assert.equal(verify.body.nextStep, 'profile');
  const registration = await request('/auth/register/complete', null, 'POST', {
    registrationToken: verify.body.registrationToken, firstName: 'مشتری', lastName: 'آزمایش',
  });
  assert.equal(registration.status, 200);
  // Advance cooldown in the isolated database, without waiting or weakening production rules.
  await db.getRepository(OtpChallengeEntity).update(send.body.challengeId, { resendAvailableAt: new Date(Date.now() - 1).toISOString() });
  const loginSend = await request('/auth/otp/send', null, 'POST', { phone, purpose: 'login' });
  const login = await request('/auth/otp/verify', null, 'POST', { challengeId: loginSend.body.challengeId, code: codes.get(phone) });
  assert.equal(login.body.nextStep, 'done');
  const token = login.body.accessToken;
  const catalog = await request('/products?limit=20&page=1');
  assert.equal(catalog.status, 200);
  const product = catalog.body.data[0];
  assert.ok(product);
  const requested = await request('/quotations/request', token, 'POST', { items: [{ productId: product.id, quantity: 1 }] });
  assert.equal(requested.status, 201, JSON.stringify(requested.body));
  const quoteId = requested.body.id;
  const adminQuotes = await request('/quotations/admin/all', adminToken);
  assert.ok(adminQuotes.body.some(q => q.id === quoteId));
  assert.equal((await request(`/quotations/${quoteId}/status`, adminToken, 'PATCH', { status: 'sent' })).status, 200);
  const accepted = await request(`/quotations/${quoteId}/accept`, token, 'PATCH');
  assert.equal(accepted.status, 200, JSON.stringify(accepted.body));
  assert.equal(accepted.body.acceptedBy, registration.body.user.id);
  const converted = await request(`/orders/from-quotation/${quoteId}`, token, 'POST');
  assert.equal(converted.status, 201);
  const invoices = await request('/invoices/mine', token);
  const invoice = invoices.body.find(i => i.orderId === converted.body.id);
  assert.ok(invoice);
  const payment = await request(`/payments/${invoice.id}/pay`, token, 'POST', { amount: invoice.totalAfterTax, paymentMethod: 'bank_transfer' });
  assert.equal(payment.status, 201, JSON.stringify(payment.body));
  assert.equal((await request(`/payments/admin/${payment.body.id}/status`, token, 'PATCH', { status: 'completed' })).status, 403);
  const approved = await request(`/payments/admin/${payment.body.id}/status`, adminToken, 'PATCH', { status: 'completed' });
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  assert.equal((await request(`/orders/mine/${converted.body.id}`, token)).body.paymentStatus, 'paid');
  assert.equal((await request(`/invoices/mine/${invoice.id}`, token)).body.paymentStatus, 'paid');
});

test('OTP incorrect, expired and repeated codes cannot authenticate', async () => {
  const { user } = await account();
  const send = await request('/auth/otp/send', null, 'POST', { phone: user.phone, purpose: 'login' });
  for (let i = 0; i < 5; i++) {
    assert.equal((await request('/auth/otp/verify', null, 'POST', { challengeId: send.body.challengeId, code: '00000' })).status, 401);
  }
  assert.equal((await request('/auth/otp/verify', null, 'POST', { challengeId: send.body.challengeId, code: codes.get(user.phone) })).status, 429);
  await db.getRepository(OtpChallengeEntity).update(send.body.challengeId, { expiresAt: new Date(Date.now() - 1).toISOString() });
  assert.equal((await request('/auth/otp/verify', null, 'POST', { challengeId: send.body.challengeId, code: codes.get(user.phone) })).status, 400);
  const next = await account();
  const challenge = await request('/auth/otp/send', null, 'POST', { phone: next.user.phone, purpose: 'login' });
  const responses = await Promise.all(Array.from({ length: 2 }, () => request('/auth/otp/verify', null, 'POST', {
    challengeId: challenge.body.challengeId, code: codes.get(next.user.phone),
  })));
  assert.equal(responses.filter(r => r.status === 200).length, 1);
});
