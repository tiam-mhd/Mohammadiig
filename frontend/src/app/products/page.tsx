import type { Metadata } from 'next';
import { ProductsCatalog } from '@/components/ProductsCatalog';

export const metadata: Metadata = {
  title: 'محصولات | MIG',
  description: 'کاتالوگ تجهیزات شهربازی، ماشین برخوردی و قطعات یدکی گروه صنعتی محمدی.',
};

export default function ProductsPage() {
  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <ProductsCatalog />
      </div>
    </div>
  );
}
