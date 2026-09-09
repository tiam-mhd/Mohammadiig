'use client';

import { AdminShell } from '@/components/admin/AdminShell';
import { ProductManager } from '@/components/admin/ProductManager';

export default function AdminProductsPage() {
  return (
    <AdminShell eyebrow="کاتالوگ" title="محصولات">
      <ProductManager />
    </AdminShell>
  );
}
