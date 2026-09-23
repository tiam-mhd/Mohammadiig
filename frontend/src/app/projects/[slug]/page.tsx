'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchPublishedProject, OpsProject } from '@/lib/api-client';
import { labelOf, PROJECT_STATUS, PROJECT_TYPE } from '@/lib/admin-labels';
import { resolveMediaUrl } from '@/lib/media';

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
  const coverSrc = resolveMediaUrl(project.coverImageUrl);
  const gallery = (project.gallery ?? []).map((url) => resolveMediaUrl(url)).filter(Boolean);

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/projects" className="caption-up text-ink/70 transition-opacity hover:opacity-100">
          ← همه پروژه‌ها
        </Link>

        <div className="mt-10 max-w-3xl text-start md:mt-12">
          <p className="caption-up">
            {labelOf(PROJECT_TYPE, project.projectType)} · {labelOf(PROJECT_STATUS, project.status)}
          </p>
          <h1 className="display-feature mt-4 text-ink">{project.projectName}</h1>
          {project.summaryFa ? <p className="body-lead mt-5 max-w-xl">{project.summaryFa}</p> : null}
        </div>

        {coverSrc ? (
          <div className="mt-10 overflow-hidden rounded-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverSrc} alt={project.projectName} className="w-full object-cover" loading="eager" />
          </div>
        ) : null}

        {gallery.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {gallery.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
            ))}
          </div>
        ) : null}

        <dl className="mt-12 grid max-w-3xl grid-cols-1 gap-6 border-t border-hairline pt-10 text-start sm:grid-cols-2">
          {location ? (
            <div>
              <dt className="caption-up text-ink/45">لوکیشن</dt>
              <dd className="mt-2 font-ui text-sm text-ink">{location}</dd>
            </div>
          ) : null}
          {project.clientDisplayName ? (
            <div>
              <dt className="caption-up text-ink/45">طرف مقابل</dt>
              <dd className="mt-2 font-ui text-sm text-ink">{project.clientDisplayName}</dd>
            </div>
          ) : null}
          {project.startDate ? (
            <div>
              <dt className="caption-up text-ink/45">شروع</dt>
              <dd className="mt-2 font-ui text-sm text-ink" dir="ltr">
                {project.startDate}
              </dd>
            </div>
          ) : null}
          {project.completionDate || project.expectedCompletionDate ? (
            <div>
              <dt className="caption-up text-ink/45">اتمام</dt>
              <dd className="mt-2 font-ui text-sm text-ink" dir="ltr">
                {project.completionDate || project.expectedCompletionDate}
              </dd>
            </div>
          ) : null}
          {project.migInvestmentPercentage > 0 ? (
            <div>
              <dt className="caption-up text-ink/45">سهم سرمایه‌گذاری MIG</dt>
              <dd className="mt-2 font-ui text-sm text-ink">
                {project.migInvestmentPercentage.toLocaleString('fa-IR')}٪
              </dd>
            </div>
          ) : null}
          {project.profitSharingPercentage > 0 ? (
            <div>
              <dt className="caption-up text-ink/45">سهم سود</dt>
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
