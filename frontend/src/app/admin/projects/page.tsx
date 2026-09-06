'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DataTable } from '@/components/admin/DataTable';
import { fetchAdminProjects, ProjectAdminSummary, updateProjectStatus } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

const statuses = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];
export default function AdminProjectsPage() { const token = useAuthStore((state) => state.accessToken); const [projects, setProjects] = useState<ProjectAdminSummary[]>([]); useEffect(() => { if (token) fetchAdminProjects(token).then(setProjects).catch(() => undefined); }, [token]); async function change(id: string, status: string) { if (!token) return; const updated = await updateProjectStatus(token, id, status); setProjects((items) => items.map((item) => item.id === id ? updated : item)); } return <AdminShell eyebrow="MIG / DELIVERY" title="پروژه‌ها"><DataTable headers={['کد پروژه', 'نام پروژه', 'مشتری', 'بودجه', 'وضعیت']}><div>{projects.map((project) => <div key={project.id} className="grid gap-3 border-b border-neutral-200 p-5 last:border-0 sm:grid-cols-5 sm:items-center dark:border-white/10"><strong>{project.projectCode}</strong><span className="font-bold">{project.projectName}</span><span className="text-xs text-neutral-500">{project.customerId.slice(0, 8)}...</span><span className="text-sm text-primary-600 dark:text-primary-500">{project.budgetTotal.toLocaleString('fa-IR')} ریال</span><select value={project.status} onChange={(event) => change(project.id, event.target.value)} className="border border-neutral-300 bg-transparent px-2 py-2 text-xs dark:border-white/20">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>)}{projects.length === 0 && <p className="py-16 text-center text-neutral-500">پروژه‌ای ثبت نشده است.</p>}</div></DataTable></AdminShell>; }
