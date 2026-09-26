require("reflect-metadata");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

test(
  "PostgreSQL migrations, upgrade preservation and concurrent financial requests",
  {
    skip: !process.env.TEST_DATABASE_URL,
  },
  async () => {
    process.env.DB_DRIVER = "postgres";
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const { Client } = require("pg");
    const { DataSource } = require("typeorm");
    const {
      buildDatabaseDataSourceOptions,
    } = require("../dist/database.options");
    const { OrdersService } = require("../dist/orders/orders.service");
    const { PaymentsService } = require("../dist/payments/payments.service");
    const { OrderEntity } = require("../dist/orders/order.entity");
    const { OrderItemEntity } = require("../dist/orders/order-item.entity");
    const { QuotationEntity } = require("../dist/quotations/quotation.entity");
    const { CustomerEntity } = require("../dist/customers/customer.entity");
    const { InvoiceEntity } = require("../dist/invoices/invoice.entity");
    const { SparePartEntity } = require("../dist/products/spare-part.entity");
    const { UserEntity } = require("../dist/auth/user.entity");
    const { PaymentEntity } = require("../dist/payments/payment.entity");
    const client = new Client({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    await client.connect();
    const schema = `mig_test_${randomUUID().replaceAll("-", "")}`;
    let db;
    await client.query(`CREATE SCHEMA "${schema}"`);
    try {
      const options = {
        ...buildDatabaseDataSourceOptions(),
        schema,
        logging: false,
        extra: { options: `-c search_path=${schema}`, max: 10 },
      };
      // Upgrade an existing schema containing a real sentinel row from the previous migration boundary.
      const baseline = new DataSource({
        ...options,
        migrations: options.migrations.filter(
          (m) => Number(m.name.slice(-13)) <= 1710000021000,
        ),
      });
      await baseline.initialize();
      await baseline
        .getRepository(UserEntity)
        .save({ id: "preserved-user", email: "preserved@example.com" });
      await baseline.destroy();
      db = new DataSource(options);
      await db.initialize();
      assert.equal(
        (
          await db
            .getRepository(UserEntity)
            .findOneByOrFail({ id: "preserved-user" })
        ).email,
        "preserved@example.com",
      );
      assert.equal(await db.showMigrations(), false);
      const service = new OrdersService(
        ...[
          OrderEntity,
          OrderItemEntity,
          QuotationEntity,
          CustomerEntity,
          InvoiceEntity,
          SparePartEntity,
          UserEntity,
          PaymentEntity,
        ].map((e) => db.getRepository(e)),
        db,
      );
      const payments = new PaymentsService(
        ...[PaymentEntity, InvoiceEntity, CustomerEntity, OrderEntity].map(
          (e) => db.getRepository(e),
        ),
      );
      const user = { userId: "preserved-user", role: "customer" };
      const customer = await db
        .getRepository(CustomerEntity)
        .save({ id: randomUUID(), userId: user.userId });
      const quote = await db.getRepository(QuotationEntity).save({
        id: randomUUID(),
        quotationNumber: randomUUID(),
        customerId: customer.id,
        validUntil: new Date(Date.now() + 86400000),
        status: "accepted",
        subtotal: 100,
        totalAmount: 100,
        items: [
          {
            productId: randomUUID(),
            productName: "محصول",
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100,
            customizations: {},
          },
        ],
      });
      const orders = await Promise.all(
        Array.from({ length: 5 }, () =>
          service.convertQuotation(user, quote.id),
        ),
      );
      assert.equal(new Set(orders.map((o) => o.id)).size, 1);
      assert.equal(
        await db
          .getRepository(OrderItemEntity)
          .countBy({ orderId: orders[0].id }),
        1,
      );
      const invoice = await db
        .getRepository(InvoiceEntity)
        .findOneByOrFail({ orderId: orders[0].id });
      const requests = await Promise.allSettled(
        Array.from({ length: 5 }, () =>
          payments.create(user, invoice.id, {
            amount: 100,
            paymentMethod: "cash",
          }),
        ),
      );
      assert.equal(requests.filter((r) => r.status === "fulfilled").length, 1);
      const payment = requests.find((r) => r.status === "fulfilled").value;
      await Promise.all(
        Array.from({ length: 5 }, () =>
          payments.updateStatus(payment.id, "completed", {
            userId: "test-admin",
          }),
        ),
      );
      assert.equal(
        await db
          .getRepository(PaymentEntity)
          .sum("amount", { invoiceId: invoice.id, paymentStatus: "completed" }),
        100,
      );
      assert.equal(
        (
          await db
            .getRepository(InvoiceEntity)
            .findOneByOrFail({ id: invoice.id })
        ).paymentStatus,
        "paid",
      );
      assert.equal(
        (
          await db
            .getRepository(OrderEntity)
            .findOneByOrFail({ id: orders[0].id })
        ).paymentStatus,
        "paid",
      );
      const logs = await db.query(
        "SELECT id FROM audit_logs WHERE entity_id = $1 AND action = $2",
        [payment.id, "payment.status_changed"],
      );
      assert.equal(logs.length, 1);
    } finally {
      if (db?.isInitialized) await db.destroy();
      // Only the random schema created by this test is removed, never the configured database.
      await client.query(`DROP SCHEMA "${schema}" CASCADE`);
      await client.end();
    }
  },
);
