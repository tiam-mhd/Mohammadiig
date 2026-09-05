import type { Metadata } from 'next';
import { ProductsCatalog } from '@/components/ProductsCatalog';

export const metadata: Metadata = {
  title: 'محصولات | MIG',
  description: 'کاتالوگ تجهیزات تفریحی، ماشین‌های برقی و قطعات یدکی MIG.',
};

export default function ProductsPage() {
  return <main className="min-h-screen bg-neutral-50 px-5 py-20 dark:bg-neutral-900 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1400px]"><ProductsCatalog /></div></main>;
}
