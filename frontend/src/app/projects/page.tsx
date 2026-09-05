'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components';
import { fetchMyProjects, ProjectSummary } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function ProjectsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  useEffect(() => { if (token) fetchMyProjects(token).then(setProjects).catch(() => undefined); }, [token]);
  if (!token) return <main className="min-h-screen bg-neutral-50 px-5 py-32 text-center dark:bg-neutral-900"><span className="eyebrow">MIG PROJECTS</span><h1 className="mt-5 text-4xl font-black dark:text-white">پروژه‌های شما</h1><Link href="/auth" className="mt-8 inline-block bg-primary-500 px-7 py-4 font-bold text-neutral-900">ورود به پنل</Link></main>;
  return <main className="min-h-screen bg-neutral-50 px-5 py-20 dark:bg-neutral-900 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1100px]"><span className="eyebrow">MIG / PROJECTS</span><h1 className="mt-4 text-5xl font-black text-neutral-900 dark:text-white sm:text-7xl">پروژه‌های شما</h1><p className="mt-5 max-w-xl leading-8 text-neutral-500">وضعیت پروژه‌های اجرایی، سرمایه‌گذاری و تامین تجهیزات خود را دنبال کنید.</p><div className="mt-14 space-y-4">{projects.map((project) => <article key={project.id} className="border border-neutral-200 bg-white p-6 dark:border-white/10 dark:bg-[#1b1d1b]"><div className="flex flex-col justify-between gap-5 sm:flex-row"><div><span className="eyebrow">{project.projectCode} / {project.status}</span><h2 className="mt-3 text-2xl font-black dark:text-white">{project.projectName}</h2><p className="mt-3 text-sm leading-7 text-neutral-500">{project.description}</p></div><Link href={`/projects/${project.id}/phases`}><Button size="sm" variant="outline" className="h-fit rounded-none">مشاهده مراحل</Button></Link></div></article>)}{projects.length === 0 && <p className="border border-dashed border-neutral-300 py-16 text-center text-neutral-500">پروژه‌ای برای این حساب ثبت نشده است.</p>}</div></div></main>;
}
