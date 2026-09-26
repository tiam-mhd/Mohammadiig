/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..", "src");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("main error pages are Persian, RTL and retryable", () => {
  const error = read("app/error.tsx");
  const notFound = read("app/not-found.tsx");
  assert.match(error, /تلاش دوباره/);
  assert.match(notFound, /صفحه پیدا نشد/);
  assert.match(error, /dir="rtl"/);
  assert.match(notFound, /dir="rtl"/);
});

test("public product catalog uses API data and explicit states", () => {
  const page = read("components/ProductsCatalog.tsx");
  assert.match(page, /fetchProducts/);
  assert.match(page, /تلاش دوباره/);
  assert.match(page, /محصولی در این دسته پیدا نشد/);
  assert.doesNotMatch(page, /unsplash\.com/i);
});

test("admin dashboard uses live metrics and no placeholder dash", () => {
  const page = read("app/admin/page.tsx");
  assert.match(page, /fetchAdminDashboard/);
  assert.match(page, /دریافت آمار داشبورد انجام نشد/);
  assert.doesNotMatch(page, /'—'/);
});
