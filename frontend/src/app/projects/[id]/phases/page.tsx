'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchProjectPhases, ProjectPhaseSummary } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function ProjectPhasesPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const [phases, setPhases] = useState<ProjectPhaseSummary[]>([]);
  useEffect(() => { if (token) fetchProjectPhases(token, id).then(setPhases).catch(() => undefined); }, [token, id]);
  if (!token) return <main className="min-h-screen bg-neutral-50 px-5 py-32 text-center dark:bg-neutral-900"><Link href="/auth" className="text-primary-500">ورود به پنل</Link></main>;
  return <main className="min-h-screen bg-neutral-50 px-5 py-20 dark:bg-neutral-900 sm:px-8 sm:py-28"><div className="mx-auto max-w-[900px]"><Link href="/projects" className="text-xs font-bold text-primary-500">← بازگشت به پروژه‌ها</Link><h1 className="mt-12 text-5xl font-black text-neutral-900 dark:text-white">مراحل پروژه</h1><div className="mt-12 border-r border-primary-500/40 pr-8">{phases.map((phase) => <article key={phase.id} className="relative mb-8 border border-neutral-200 bg-white p-6 dark:border-white/10 dark:bg-[#1b1d1b]"><span className="absolute -right-[41px] top-7 h-4 w-4 rounded-full border-4 border-neutral-50 bg-primary-500 dark:border-neutral-900" /><span className="eyebrow">PHASE {phase.phaseNumber} / {phase.status}</span><h2 className="mt-3 text-2xl font-black dark:text-white">{phase.phaseNameFa}</h2><p className="mt-3 text-sm leading-7 text-neutral-500">{phase.description}</p><p className="mt-5 text-xs text-neutral-400">{phase.startDate} تا {phase.endDate}</p></article>)}{phases.length === 0 && <p className="py-12 text-neutral-500">هنوز مرحله‌ای برای این پروژه ثبت نشده است.</p>}</div></div></main>;
}
