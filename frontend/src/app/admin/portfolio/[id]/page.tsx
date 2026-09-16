'use client';

import { useParams } from 'next/navigation';
import { PortfolioEditorPage } from '@/components/admin/PortfolioEditorPage';

export default function AdminEditPortfolioPage() {
  const params = useParams<{ id: string }>();
  return <PortfolioEditorPage workId={params.id} />;
}
