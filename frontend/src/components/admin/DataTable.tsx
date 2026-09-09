'use client';

import { ReactNode } from 'react';

export function DataTable({
  headers,
  children,
  emptyText = 'موردی برای نمایش وجود ندارد.',
  isEmpty = false,
}: {
  headers: string[];
  children: ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-data-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="admin-data-table__empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DataRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={className.trim()}>{children}</tr>;
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="admin-row-actions">{children}</div>;
}
