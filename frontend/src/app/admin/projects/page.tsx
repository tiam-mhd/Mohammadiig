'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataRow, DataTable } from '@/components/admin/DataTable';
import { fetchAdminProjects, ProjectAdminSummary, updateProjectStatus } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];

export default function AdminProjectsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [projects, setProjects] = useState<ProjectAdminSummary[]>([]);

  useEffect(() => {
    if (token) fetchAdminProjects(token).then(setProjects).catch(() => undefined);
  }, [token]);

  async function change(id: string, status: string) {
    if (!token) return;
    const updated = await updateProjectStatus(token, id, status);
    setProjects((items) => items.map((item) => (item.id === id ? updated : item)));
  }

  return (
    <AdminShell eyebrow="تحویل" title="پروژه‌ها">
      <DataTable headers={['کد پروژه', 'نام پروژه', 'مشتری', 'بودجه', 'وضعیت']}>
        {projects.map((project) => (
          <DataRow key={project.id} className="text-start">
            <strong className="font-normal text-ink">{project.projectCode}</strong>
            <span className="text-ink">{project.projectName}</span>
            <span className="text-xs text-muted">{project.customerId.slice(0, 8)}…</span>
            <span className="text-ink">{project.budgetTotal.toLocaleString('fa-IR')} ریال</span>
            <select
              value={project.status}
              onChange={(event) => change(project.id, event.target.value)}
              className="admin-select"
              aria-label={`وضعیت ${project.projectCode}`}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </DataRow>
        ))}
        {projects.length === 0 ? (
          <p className="py-14 text-center font-ui text-sm text-muted">پروژه‌ای ثبت نشده است.</p>
        ) : null}
      </DataTable>
    </AdminShell>
  );
}
