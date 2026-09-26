import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from "typeorm";

export class PaymentIntegrityAudit1710000023000 implements MigrationInterface {
  name = "PaymentIntegrityAudit1710000023000";
  async up(runner: QueryRunner): Promise<void> {
    for (const sql of [
      "SELECT transaction_id FROM payments WHERE transaction_id IS NOT NULL GROUP BY transaction_id HAVING COUNT(*) > 1",
      "SELECT invoice_id FROM payments WHERE payment_status = 'pending' GROUP BY invoice_id HAVING COUNT(*) > 1",
    ]) {
      const duplicates: unknown[] = await runner.query(sql);
      if (duplicates.length)
        throw new Error(
          "پرداخت تکراری موجود است؛ بررسی مالی پیش از Migration لازم است. هیچ داده‌ای حذف نشد.",
        );
    }
    await runner.addColumn(
      "payments",
      new TableColumn({
        name: "processed_at",
        type: "varchar",
        length: "40",
        isNullable: true,
      }),
    );
    await runner.createIndex(
      "payments",
      new TableIndex({
        name: "uq_payment_transaction",
        columnNames: ["transaction_id"],
        isUnique: true,
      }),
    );
    await runner.createIndex(
      "payments",
      new TableIndex({
        name: "uq_payment_pending_invoice",
        columnNames: ["invoice_id"],
        isUnique: true,
        where: "payment_status = 'pending'",
      }),
    );
    await runner.createTable(
      new Table({
        name: "audit_logs",
        columns: [
          { name: "id", type: "text", isPrimary: true },
          {
            name: "actor_user_id",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          { name: "action", type: "varchar", length: "100" },
          { name: "entity_type", type: "varchar", length: "100" },
          { name: "entity_id", type: "varchar", length: "100" },
          { name: "old_value", type: "text", isNullable: true },
          { name: "new_value", type: "text", isNullable: true },
          {
            name: "ip_address",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "user_agent",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "created_at",
            type:
              runner.connection.options.type === "postgres"
                ? "timestamp"
                : "datetime",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
    );
    await runner.createIndex(
      "audit_logs",
      new TableIndex({
        name: "idx_audit_entity_created",
        columnNames: ["entity_type", "entity_id", "created_at"],
      }),
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    const rows: unknown[] = await runner.query(
      "SELECT id FROM audit_logs LIMIT 1",
    );
    if (rows.length)
      throw new Error("بازگشت Migration به دلیل وجود سوابق حسابرسی مجاز نیست.");
    await runner.dropTable("audit_logs");
    await runner.dropIndex("payments", "uq_payment_pending_invoice");
    await runner.dropIndex("payments", "uq_payment_transaction");
    await runner.dropColumn("payments", "processed_at");
  }
}
