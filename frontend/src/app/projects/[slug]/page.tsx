'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchPublishedProject, OpsProject } from '@/lib/api-client';
import { labelOf, PROJECT_STATUS, PROJECT_TYPE } from '@/lib/admin-labels';

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [project, setProject] = useState<OpsProject | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetchPublishedProject(slug)
      .then(setProject)
      .catch(() => setError('پروژه پیدا نشد.'));
  }, [slug]);

  if (error) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="body-lead">{error}</p>
          <Link href="/projects" className="btn-pill mt-8 inline-flex">
            بازگشت به پروژه‌ها
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="body-lead">در حال دریافت…</p>
        </div>
      </div>
    );
  }

  const location = [project.country, project.province, project.city, project.locationDetail]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/projects" className="caption-up text-white/70 transition-opacity hover:opacity-100">
          ← همه پروژه‌ها
        </Link>

        <div className="mt-10 max-w-3xl text-start md:mt-12">
          <p className="caption-up">
            {labelOf(PROJECT_TYPE, project.projectType)} · {labelOf(PROJECT_STATUS, project.status)}
          </p>
          <h1 className="display-feature mt-4 text-ink">{project.projectName}</h1>
          {project.summaryFa ? <p className="body-lead mt-5 max-w-xl">{project.summaryFa}</p> : null}
        </div>

        <dl className="mt-12 grid max-w-3xl grid-cols-1 gap-6 border-t border-hairline pt-10 text-start sm:grid-cols-2">
          {location ? (
            <div>
              <dt className="caption-up text-white/45">لوکیشن</dt>
              <dd className="mt-2 font-ui text-sm text-ink">{location}</dd>
            </div>
          ) : null}
          {project.clientDisplayName ? (
            <div>
              <dt className="caption-up text-white/45">طرف مقابل</dt>
              <dd className="mt-2 font-ui text-sm text-ink">{project.clientDisplayName}</dd>
            </div>
          ) : null}
          {project.startDate ? (
            <div>
              <dt className="caption-up text-white/45">شروع</dt>
              <dd className="mt-2 font-ui text-sm text-ink" dir="ltr">
                {project.startDate}
              </dd>
            </div>
          ) : null}
          {project.completionDate || project.expectedCompletionDate ? (
            <div>
              <dt className="caption-up text-white/45">اتمام</dt>
              <dd className="mt-2 font-ui text-sm text-ink" dir="ltr">
                {project.completionDate || project.expectedCompletionDate}
              </dd>
            </div>
          ) : null}
          {project.migInvestmentPercentage > 0 ? (
            <div>
              <dt className="caption-up text-white/45">سهم سرمایه‌گذاری MIG</dt>
              <dd className="mt-2 font-ui text-sm text-ink">
                {project.migInvestmentPercentage.toLocaleString('fa-IR')}٪
              </dd>
            </div>
          ) : null}
          {project.profitSharingPercentage > 0 ? (
            <div>
              <dt className="caption-up text-white/45">سهم سود</dt>
              <dd className="mt-2 font-ui text-sm text-ink">
                {project.profitSharingPercentage.toLocaleString('fa-IR')}٪
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-12 max-w-3xl border-t border-hairline pt-10 text-start">
          <p className="body-lead whitespace-pre-line text-sm leading-relaxed">{project.description}</p>
        </div>

        {project.highlights?.length ? (
          <ul className="mt-10 max-w-xl space-y-3 text-start">
            {project.highlights.map((item) => (
              <li key={item} className="border-b border-hairline pb-3 font-ui text-sm text-ink">
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-14">
          <Link href="/quote-request" className="btn-pill inline-flex">
            مشاوره همکاری
          </Link>
        </div>
      </div>
    </div>
  );
}
