require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { DataSource } = require('typeorm');
const { buildDatabaseDataSourceOptions } = require('../dist/database.options');
const { OrdersService } = require('../dist/orders/orders.service');
const { PaymentsService } = require('../dist/payments/payments.service');
const { OrderEntity } = require('../dist/orders/order.entity');
const { OrderItemEntity } = require('../dist/orders/order-item.entity');
const { QuotationEntity } = require('../dist/quotations/quotation.entity');
const { CustomerEntity } = require('../dist/customers/customer.entity');
const { InvoiceEntity } = require('../dist/invoices/invoice.entity');
const { SparePartEntity } = require('../dist/products/spare-part.entity');
const { UserEntity } = require('../dist/auth/user.entity');
const { PaymentEntity } = require('../dist/payments/payment.entity');
const { UniqueQuotationOrder1710000022000 } = require('../dist/database/migrations/1710000022000-unique-quotation-order');
let db, service;
before(async () => {
  process.env.DB_DRIVER = 'sqlite'; process.env.DATABASE_URL = ''; process.env.DATABASE_PATH = ':memory:';
  db = new DataSource({ ...buildDatabaseDataSourceOptions(), logging: false });
  await db.initialize();
  service = new OrdersService(...[OrderEntity, OrderItemEntity, QuotationEntity, CustomerEntity,
    InvoiceEntity, SparePartEntity, UserEntity, PaymentEntity].map(entity => db.getRepository(entity)), db);
});
after(async () => db?.destroy());

async function quotation(status = 'accepted') {
  const userId = randomUUID();
  await db.getRepository(UserEntity).save({ id: userId });
  const customer = await db.getRepository(CustomerEntity).save({ id: randomUUID(), userId });
  const quote = await db.getRepository(QuotationEntity).save({
    id: randomUUID(), quotationNumber: randomUUID(), customerId: customer.id,
    validUntil: new Date(Date.now() + 86400000), status, subtotal: 100, totalAmount: 100,
    items: [{ productId: randomUUID(), productName: 'محصول', quantity: 1, unitPrice: 100, lineTotal: 100, customizations: {} }],
  });
  return { quote, user: { userId, role: 'customer' } };
}

test('conversion creates a single order, items and invoice and repeats return original', async () => {
  const { quote, user } = await quotation();
  const order = await service.convertQuotation(user, quote.id);
  assert.equal((await service.convertQuotation(user, quote.id)).id, order.id);
  assert.equal(await db.getRepository(OrderEntity).countBy({ referenceQuotationId: quote.id }), 1);
  assert.equal(await db.getRepository(OrderItemEntity).countBy({ orderId: order.id }), 1);
  const invoice = await db.getRepository(InvoiceEntity).findOneByOrFail({ orderId: order.id });
  assert.equal(invoice.totalAfterTax, 100);
  assert.equal(invoice.lineItemsJson[0].title, 'محصول');
  await assert.rejects(db.getRepository(OrderEntity).save({ ...order, id: randomUUID(), orderNumber: randomUUID() }));
});

test('invoice failure rolls back order and all items', async () => {
  const { quote, user } = await quotation();
  const count = await db.getRepository(OrderItemEntity).count();
  await db.query("CREATE TRIGGER reject_test_invoice BEFORE INSERT ON invoices BEGIN SELECT RAISE(ABORT, 'forced rollback'); END");
  try { await assert.rejects(service.convertQuotation(user, quote.id), /forced rollback/); }
  finally { await db.query('DROP TRIGGER reject_test_invoice'); }
  assert.equal(await db.getRepository(OrderEntity).countBy({ referenceQuotationId: quote.id }), 0);
  assert.equal(await db.getRepository(OrderItemEntity).count(), count);
  assert.equal(await db.getRepository(InvoiceEntity).countBy({ quotationId: quote.id }), 0);
});

test('conversion rejects another customer and unaccepted quotation', async () => {
  const { quote, user } = await quotation('sent');
  await assert.rejects(service.convertQuotation(user, quote.id), /پذیرفته/);
  await assert.rejects(service.convertQuotation({ userId: randomUUID(), role: 'customer' }, quote.id), /یافت نشد/);
});

test('production rejects both simulated payment entry points before database access', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await assert.rejects(service.checkoutSpareParts({}, { payWithTestGateway: true }), /عملیاتی/);
    await assert.rejects(new PaymentsService().payWithTestGateway({}, 'unknown'), /عملیاتی/);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous;
  }
});

test('unique quotation migration preserves existing rows and refuses ambiguous financial duplicates', async () => {
  const { quote, user } = await quotation();
  const order = await service.convertQuotation(user, quote.id);
  const migration = new UniqueQuotationOrder1710000022000();
  const runner = db.createQueryRunner();
  await migration.down(runner);
  await migration.up(runner);
  assert.equal((await db.getRepository(OrderEntity).findOneByOrFail({ id: order.id })).totalAmount, 100);
  await migration.down(runner);
  const duplicate = await db.getRepository(OrderEntity).save({ ...order, id: randomUUID(), orderNumber: randomUUID() });
  await assert.rejects(migration.up(runner), /هیچ داده‌ای حذف نشد/);
  assert.equal(await db.getRepository(OrderEntity).countBy({ referenceQuotationId: quote.id }), 2);
  await db.getRepository(OrderEntity).delete(duplicate.id);
  await migration.up(runner);
  await runner.release();
});

test('partial payment, pending duplicate, remaining balance and terminal transitions', async () => {
  const { quote, user } = await quotation();
  const order = await service.convertQuotation(user, quote.id);
  const invoice = await db.getRepository(InvoiceEntity).findOneByOrFail({ orderId: order.id });
  const payments = new PaymentsService(...[PaymentEntity, InvoiceEntity, CustomerEntity, OrderEntity].map(e => db.getRepository(e)));
  const actor = { userId: 'test-administrator', ipAddress: '127.0.0.1', userAgent: 'integration-test' };
  for (const amount of [0, -1, 101, 1.5]) {
    await assert.rejects(payments.create(user, invoice.id, { amount, paymentMethod: 'bank_transfer' }));
  }
  await assert.rejects(payments.create({ userId: randomUUID() }, invoice.id, { amount: 50, paymentMethod: 'cash' }), /یافت نشد/);
  const first = await payments.create(user, invoice.id, { amount: 40, paymentMethod: 'bank_transfer', transactionId: randomUUID() });
  await assert.rejects(payments.create(user, invoice.id, { amount: 40, paymentMethod: 'cash' }), /انتظار/);
  const completed = await payments.updateStatus(first.id, 'completed', actor);
  assert.equal(completed.processedBy, actor.userId);
  assert.ok(completed.processedAt);
  assert.equal((await db.getRepository(InvoiceEntity).findOneByOrFail({ id: invoice.id })).paymentStatus, 'partially_paid');
  assert.equal((await db.getRepository(OrderEntity).findOneByOrFail({ id: order.id })).paymentStatus, 'partially_paid');
  await assert.rejects(payments.create(user, invoice.id, { amount: 61, paymentMethod: 'cash' }), /مانده/);
  await assert.rejects(payments.updateStatus(first.id, 'failed', actor), /مجاز نیست/);
  await assert.rejects(payments.updateStatus(first.id, 'paid', actor), /معتبر نیست/);
  const failed = await payments.create(user, invoice.id, { amount: 60, paymentMethod: 'cash' });
  await payments.updateStatus(failed.id, 'failed', actor);
  assert.equal((await db.getRepository(InvoiceEntity).findOneByOrFail({ id: invoice.id })).paymentStatus, 'partially_paid');
  const cancelled = await payments.create(user, invoice.id, { amount: 60, paymentMethod: 'cash' });
  await payments.updateStatus(cancelled.id, 'cancelled', actor);
  const final = await payments.create(user, invoice.id, { amount: 60, paymentMethod: 'cash' });
  await payments.updateStatus(final.id, 'completed', actor);
  assert.equal((await db.getRepository(InvoiceEntity).findOneByOrFail({ id: invoice.id })).paymentStatus, 'paid');
  assert.equal((await db.getRepository(OrderEntity).findOneByOrFail({ id: order.id })).paymentStatus, 'paid');
  assert.equal(await db.getRepository(PaymentEntity).sum('amount', { invoiceId: invoice.id, paymentStatus: 'completed' }), 100);
  const audit = await db.query('SELECT * FROM audit_logs WHERE entity_id = ?', [first.id]);
  assert.equal(audit.length, 2);
  assert.equal(audit[1].actor_user_id, actor.userId);
});

test('failed audit write rolls back payment approval and invoice state', async () => {
  const { quote, user } = await quotation();
  const order = await service.convertQuotation(user, quote.id);
  const invoice = await db.getRepository(InvoiceEntity).findOneByOrFail({ orderId: order.id });
  const payments = new PaymentsService(...[PaymentEntity, InvoiceEntity, CustomerEntity, OrderEntity].map(e => db.getRepository(e)));
  const payment = await payments.create(user, invoice.id, { amount: 100, paymentMethod: 'cash' });
  await db.query("CREATE TRIGGER reject_test_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT, 'forced audit rollback'); END");
  try { await assert.rejects(payments.updateStatus(payment.id, 'completed', { userId: 'test-admin' }), /forced audit rollback/); }
  finally { await db.query('DROP TRIGGER reject_test_audit'); }
  assert.equal((await db.getRepository(PaymentEntity).findOneByOrFail({ id: payment.id })).paymentStatus, 'pending');
  assert.equal((await db.getRepository(InvoiceEntity).findOneByOrFail({ id: invoice.id })).paymentStatus, 'pending');
});
