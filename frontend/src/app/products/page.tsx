import type { Metadata } from 'next';
import { ProductsCatalog } from '@/components/ProductsCatalog';

export const metadata: Metadata = {
  title: 'محصولات | MIG',
  description: 'کاتالوگ تجهیزات شهربازی، ماشین برخوردی و قطعات یدکی گروه صنعتی محمدی.',
};

export default function ProductsPage() {
  return <ProductsCatalog />;
}
