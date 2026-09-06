'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { AttachmentAdminSummary, fetchAdminAttachments } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function AdminAttachmentsPage() { const token = useAuthStore((state) => state.accessToken); const [attachments, setAttachments] = useState<AttachmentAdminSummary[]>([]); useEffect(() => { if (token) fetchAdminAttachments(token).then(setAttachments).catch(() => undefined); }, [token]); return <AdminShell eyebrow="MIG / DOCUMENT CONTROL" title="فایل‌های ضمیمه"><DataTable headers={['نام فایل', 'مالک', 'نوع', 'حجم', 'تاریخ']}><div>{attachments.map((attachment) => <div key={attachment.id} className="grid gap-3 border-b border-neutral-200 p-5 last:border-0 sm:grid-cols-5 sm:items-center dark:border-white/10"><a href={attachment.fileUrl} target="_blank" rel="noreferrer" className="font-bold text-primary-600 hover:underline dark:text-primary-500">{attachment.fileName}</a><span className="text-xs text-neutral-500">{attachment.ownerType} / {attachment.ownerId.slice(0, 8)}...</span><span className="text-xs text-neutral-500">{attachment.fileType ?? '—'}</span><span className="text-xs text-neutral-500">{attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : '—'}</span><span className="text-xs text-neutral-500">{new Date(attachment.uploadedAt).toLocaleDateString('fa-IR')}</span></div>)}{attachments.length === 0 && <p className="py-16 text-center text-neutral-500">فایلی ثبت نشده است.</p>}</div></DataTable></AdminShell>; }
