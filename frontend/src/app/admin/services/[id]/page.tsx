'use client';

import { useParams } from 'next/navigation';
import { ServiceEditorPage } from '@/components/admin/ServiceEditorPage';

export default function AdminEditServicePage() {
  const params = useParams<{ id: string }>();
  return <ServiceEditorPage serviceId={params.id} />;
}
