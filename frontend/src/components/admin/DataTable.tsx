'use client';

import { ReactNode } from 'react';

export function DataTable({
  headers,
  columns = 'sm:grid-cols-5',
  children,
}: {
  headers: string[];
  columns?: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-table">
      <div className={`admin-table__head ${columns}`}>
        {headers.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>
      {children}
    </div>
  );
}

export function DataRow({
  columns = 'sm:grid-cols-5',
  children,
  className = '',
}: {
  columns?: string;
  children: ReactNode;
  className?: string;
}) {
  return <div className={`admin-table__row ${columns} sm:items-center ${className}`.trim()}>{children}</div>;
}
