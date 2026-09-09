'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { AttachmentAdminSummary, fetchAdminAttachments } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function AdminAttachmentsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [attachments, setAttachments] = useState<AttachmentAdminSummary[]>([]);

  useEffect(() => {
    if (token) fetchAdminAttachments(token).then(setAttachments).catch(() => undefined);
  }, [token]);

  return (
    <AdminShell eyebrow="اسناد" title="فایل‌های ضمیمه">
      <DataTable headers={['نام فایل', 'مالک', 'نوع', 'حجم', 'تاریخ']}>
        {attachments.map((attachment) => (
          <DataRow key={attachment.id} className="text-start">
            <a
              href={attachment.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-ink underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
            >
              {attachment.fileName}
            </a>
            <span className="text-xs text-muted">
              {attachment.ownerType} / {attachment.ownerId.slice(0, 8)}…
            </span>
            <span className="text-xs text-muted">{attachment.fileType ?? '—'}</span>
            <span className="text-xs text-muted">
              {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : '—'}
            </span>
            <span className="text-xs text-muted">
              {new Date(attachment.uploadedAt).toLocaleDateString('fa-IR')}
            </span>
          </DataRow>
        ))}
        {attachments.length === 0 ? (
          <p className="py-14 text-center font-ui text-sm text-muted">فایلی ثبت نشده است.</p>
        ) : null}
      </DataTable>
    </AdminShell>
  );
}
