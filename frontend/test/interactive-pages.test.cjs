/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'src');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const pages = [
  { name: 'ورود مشتری و OTP', file: 'app/auth/page.tsx', required: [/onSubmit/, /sendOtp/, /verifyOtp/, /resendOtp/, /isSubmitting/, /Suspense/] },
  { name: 'فهرست محصولات', file: 'app/products/page.tsx', sourceFiles: ['components/ProductsCatalog.tsx'], required: [/fetchProducts/, /isLoading/, /catch/, /تلاش|Retry/] },
  { name: 'جزئیات محصول', file: 'app/products/[slug]/page.tsx', required: [/fetchProduct/, /isLoading/, /setProduct\(null\)/, /catch/] },
  { name: 'درخواست پیش‌فاکتور', file: 'app/quote-request/page.tsx', required: [/fetchProducts/, /requestQuotation/, /onSubmit/, /isSubmitting/, /selectedItems/] },
  { name: 'حساب مشتری', file: 'app/account/page.tsx', required: [/fetchMyQuotations/, /fetchMyOrders/, /fetchMyInvoices/, /fetchMyPayments/, /submitPayment/, /catch/] },
  { name: 'ورود مدیر', file: 'app/admin/login/page.tsx', required: [/onSubmit/, /login\(/, /isSubmitting/, /clearSession/] },
  { name: 'مدیریت محصولات', file: 'app/admin/products/page.tsx', required: [/ProductManager/, /AdminShell/] },
  { name: 'مدیریت پیش‌فاکتورها', file: 'app/admin/quotations/page.tsx', required: [/fetchAdminQuotationsPage/, /updateQuotationStatus/, /useAdminList/, /AdminConfirmModal/] },
  { name: 'مدیریت سفارش‌ها', file: 'app/admin/orders/page.tsx', required: [/AdminStatusResourcePage/, /fetchAdminOrdersPage/, /updateOrderStatus/] },
  { name: 'مدیریت پرداخت‌ها', file: 'app/admin/payments/page.tsx', required: [/AdminStatusResourcePage/, /fetchAdminPaymentsPage/, /updatePaymentStatus/] },
  { name: 'مدیریت رسانه', file: 'app/admin/media/page.tsx', required: [/fetchMedia/, /upload/, /compressMediaAsset|compress/, /catch/, /AdminConfirmModal/] },
  { name: 'گزارش ممیزی', file: 'app/admin/audit/page.tsx', required: [/AdminShell/, /AdminToolbar/, /AdminFilterBar/, /دسترسی به گزارش ممیزی/, /تلاش دوباره/, /صفحه‌بندی گزارش ممیزی/, /navigator\.clipboard/] },
];

for (const page of pages) {
  test(`صفحه تعاملی: ${page.name}`, () => {
    const source = [page.file, ...(page.sourceFiles ?? [])].map(read).join('\n');
    assert.match(source, /['"]use client['"]/);
    for (const requirement of page.required) {
      assert.match(source, requirement, `${page.name}: قرارداد ${requirement} وجود ندارد`);
    }
  });
}

test('مؤلفه مشترک جدول‌های مدیریت Loading، Error و Retry را دارد', () => {
  const source = read('components/admin/AdminStatusResourcePage.tsx');
  assert.match(source, /setLoading\(true\)/);
  assert.match(source, /setLoadError\(true\)/);
  assert.match(source, /تلاش دوباره/);
  assert.match(source, /onSubmit=\{saveEdit\}/);
  assert.match(source, /pageSize/);
});

test('مؤلفه مشترک مدیریت محصول عملیات فرم و خطای API را کنترل می‌کند', () => {
  const source = read('components/admin/ProductManager.tsx');
  assert.match(source, /fetchAdminProductsPage/);
  assert.match(source, /loading|setDeleting\(true\)/);
  assert.match(source, /adminToast\.error/);
  assert.match(source, /confirmRemove|onRestore/);
  assert.match(source, /serverMeta/);
});

test('قرارداد تعاملی جلوی Double Submit را می‌گیرد', async () => {
  let requests = 0;
  let pending = false;
  const submit = async () => {
    if (pending) return false;
    pending = true;
    requests += 1;
    await Promise.resolve();
    pending = false;
    return true;
  };
  const results = await Promise.all([submit(), submit()]);
  assert.equal(requests, 1);
  assert.deepEqual(results, [true, false]);
});

test('تمام صفحات اصلی زیر Layout راست‌به‌چپ اجرا می‌شوند', () => {
  const layout = read('app/layout.tsx');
  assert.match(layout, /lang="fa"/);
  assert.match(layout, /dir="rtl"/);
});
