const test = require("node:test");
const assert = require("node:assert/strict");
const { DashboardController } = require("../dist/dashboard.controller.js");

const repo = (count) => ({ count: async () => count });

test("dashboard metrics are calculated by the backend and include health status", async () => {
  const controller = new DashboardController(
    { query: async () => [{ "?column?": 1 }] },
    repo(10),
    repo(8),
    repo(7),
    repo(6),
    repo(5),
    repo(4),
    repo(3),
    repo(2),
  );
  const result = await controller.metrics();
  assert.equal(result.data.products, 7);
  assert.equal(result.data.pendingPayments, 2);
  assert.deepEqual(result.data.health, { backend: "ok", database: "ok" });
  assert.equal(typeof result.generatedAt, "string");
});
