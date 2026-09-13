'use client';

import { useParams } from 'next/navigation';
import { ProductEditorPage } from '@/components/admin/ProductEditorPage';

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  return <ProductEditorPage productId={params.id} />;
}
