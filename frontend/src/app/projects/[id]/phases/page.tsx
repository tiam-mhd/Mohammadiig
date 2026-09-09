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

  useEffect(() => {
    if (token) fetchProjectPhases(token, id).then(setPhases).catch(() => undefined);
  }, [token, id]);

  if (!token) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <Link href="/auth" className="btn-pill inline-flex">
            ورود به پنل
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/projects" className="caption-up text-white/70 transition-opacity hover:opacity-100">
          ← بازگشت به پروژه‌ها
        </Link>

        <div className="mt-10 max-w-2xl text-start md:mt-12">
          <p className="caption-up">پیگیری</p>
          <h1 className="display-feature mt-4 text-ink">مراحل پروژه</h1>
        </div>

        <div className="mt-12 max-w-3xl border-t border-hairline md:mt-16">
          {phases.map((phase) => (
            <article key={phase.id} className="border-b border-hairline py-8 text-start">
              <p className="caption-up">
                مرحله {phase.phaseNumber.toLocaleString('fa-IR')} · {phase.status}
              </p>
              <h2 className="display-sm mt-3 text-ink">{phase.phaseNameFa}</h2>
              <p className="body-lead mt-3 max-w-xl text-sm">{phase.description}</p>
              <p className="caption-up mt-5 text-muted">
                {phase.startDate} تا {phase.endDate}
              </p>
            </article>
          ))}

          {phases.length === 0 ? (
            <p className="py-14 font-ui text-sm text-muted">
              هنوز مرحله‌ای برای این پروژه ثبت نشده است.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
