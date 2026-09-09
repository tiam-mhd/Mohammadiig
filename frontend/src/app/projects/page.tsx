'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMyProjects, ProjectSummary } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export default function ProjectsPage() {
  const token = useAuthStore((state) => state.accessToken);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    if (token) fetchMyProjects(token).then(setProjects).catch(() => undefined);
  }, [token]);

  if (!token) {
    return (
      <div className="bg-canvas">
        <div className="content-shell section-copy pt-28 text-center">
          <p className="caption-up">پروژه‌ها</p>
          <h1 className="display-feature mt-4 text-ink">پروژه‌های شما</h1>
          <p className="body-lead mx-auto mt-4 max-w-md">
            برای دیدن وضعیت پروژه‌ها وارد حساب کاربری شوید.
          </p>
          <Link href="/auth" className="btn-pill mt-10 inline-flex">
            ورود به پنل
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas">
      <div className="content-shell section-copy pt-24 md:pt-28">
        <div className="max-w-2xl text-start">
          <p className="caption-up">پروژه‌ها</p>
          <h1 className="display-feature mt-4 text-ink">پروژه‌های شما</h1>
          <p className="body-lead mt-4 max-w-md">
            وضعیت پروژه‌های اجرایی، تأمین تجهیزات و راه‌اندازی مجموعه را اینجا ببینید.
          </p>
        </div>

        <div className="mt-12 space-y-0 border-t border-hairline md:mt-16">
          {projects.map((project) => (
            <article
              key={project.id}
              className="flex flex-col justify-between gap-6 border-b border-hairline py-8 sm:flex-row sm:items-end"
            >
              <div className="max-w-xl text-start">
                <p className="caption-up">
                  {project.projectCode} · {project.status}
                </p>
                <h2 className="display-sm mt-3 text-ink">{project.projectName}</h2>
                <p className="body-lead mt-3 text-sm">{project.description}</p>
              </div>
              <Link href={`/projects/${project.id}/phases`} className="btn-pill shrink-0">
                مشاهده مراحل
              </Link>
            </article>
          ))}

          {projects.length === 0 ? (
            <p className="border border-dashed border-white/20 py-16 text-center font-ui text-sm text-muted">
              پروژه‌ای برای این حساب ثبت نشده است.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
