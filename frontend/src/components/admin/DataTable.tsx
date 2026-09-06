'use client';

import { ReactNode } from 'react';

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-hidden border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#1b1d1b]"><div className="hidden grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-4 border-b border-neutral-200 px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500 sm:grid dark:border-white/10">{headers.map((header) => <span key={header}>{header}</span>)}</div>{children}</div>;
}
