'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchPublishedProjects, OpsProject } from '@/lib/api-client';
import { labelOf, PROJECT_TYPE } from '@/lib/admin-labels';

function locationLine(project: OpsProject) {
  return [project.province, project.city, project.locationDetail].filter(Boolean).join(' · ');
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<OpsProject[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchPublishedProjects()
      .then(setProjects)
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <Link href="/" className="caption-up text-white/70 transition-opacity hover:opacity-100">
          ← بازگشت به صفحه اول
        </Link>

        <div className="mt-10 max-w-2xl text-start md:mt-12">
          <p className="caption-up">بهره‌برداری · مشارکت · سرمایه‌گذاری</p>
          <h1 className="display-feature mt-4 text-ink">پروژه‌های بهره‌برداری</h1>
          <p className="body-lead mt-5 max-w-md">
            پروژه‌هایی که MIG در بهره‌برداری، مشارکت یا سرمایه‌گذاری آن‌ها نقش داشته است — با جزئیات مکان و نوع همکاری.
          </p>
        </div>

        <div className="mt-12 border-t border-hairline md:mt-16">
          {projects.map((project) => (
            <article
              key={project.id}
              className="flex flex-col justify-between gap-6 border-b border-hairline py-8 sm:flex-row sm:items-end"
            >
              <div className="max-w-xl text-start">
                <p className="caption-up">
                  {labelOf(PROJECT_TYPE, project.projectType)}
                  {locationLine(project) ? ` · ${locationLine(project)}` : ''}
                </p>
                <h2 className="display-sm mt-3 text-ink">{project.projectName}</h2>
                <p className="body-lead mt-3 text-sm">{project.summaryFa || project.description}</p>
                {project.clientDisplayName ? (
                  <p className="caption-up mt-4 text-white/45">طرف مقابل: {project.clientDisplayName}</p>
                ) : null}
              </div>
              {project.slug ? (
                <Link href={`/projects/${project.slug}`} className="btn-pill shrink-0">
                  جزئیات پروژه
                </Link>
              ) : null}
            </article>
          ))}

          {loaded && projects.length === 0 ? (
            <p className="border border-dashed border-white/20 py-16 text-center font-ui text-sm text-muted">
              هنوز پروژه‌ای منتشر نشده است.
            </p>
          ) : null}

          {!loaded ? (
            <p className="border border-dashed border-white/20 py-16 text-center font-ui text-sm text-muted">
              در حال دریافت پروژه‌ها…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
