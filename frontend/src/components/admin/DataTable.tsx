'use client';

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  ReactElement,
  ReactNode,
  useContext,
  useId,
  useState,
} from 'react';

type TableCtx = {
  headers: string[];
};

const DataTableContext = createContext<TableCtx>({ headers: [] });

function cellRole(label: string, index: number, total: number) {
  if (label === 'عملیات') return 'actions' as const;
  if (label === 'وضعیت') return 'status' as const;
  if (index === 0) return 'primary' as const;
  // last column without explicit label still treated as actions when it looks like it
  if (index === total - 1 && /عمل/.test(label)) return 'actions' as const;
  return 'detail' as const;
}

function roleClass(role: ReturnType<typeof cellRole>) {
  switch (role) {
    case 'primary':
      return 'is-primary-cell';
    case 'status':
      return 'is-status-cell';
    case 'actions':
      return 'is-actions-cell';
    default:
      return 'is-detail-cell';
  }
}

export function DataTable({
  headers,
  children,
  emptyText = 'موردی برای نمایش وجود ندارد.',
  isEmpty = false,
  loading = false,
}: {
  headers: string[];
  children: ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
  loading?: boolean;
}) {
  return (
    <DataTableContext.Provider value={{ headers }}>
      <div className={`admin-table-wrap ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
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
              <tr className="admin-data-table__empty-row">
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
    </DataTableContext.Provider>
  );
}

export function DataRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { headers } = useContext(DataTableContext);
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const childList = Children.toArray(children);
  const total = childList.length;

  const cells = childList.map((cell, index) => {
    if (!isValidElement(cell)) return cell;
    const cellElement = cell as ReactElement<{ className?: string; children?: ReactNode }>;
    const label = headers[index] ?? '';
    const role = cellRole(label, index, total);
    const nextClass = [cellElement.props.className, roleClass(role)].filter(Boolean).join(' ');

    if (role === 'primary') {
      return cloneElement(cellElement, {
        ...({ 'data-label': label } as object),
        className: nextClass,
        children: (
          <div className="admin-data-card__summary">
            <button
              type="button"
              className="admin-data-card__toggle"
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={expanded ? 'بستن جزئیات' : 'نمایش جزئیات'}
              onClick={() => setExpanded((current) => !current)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="admin-data-card__title"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpanded((current) => !current)}
            >
              <span className="admin-data-card__title-body">{cellElement.props.children}</span>
            </button>
          </div>
        ),
      });
    }

    return cloneElement(cellElement, {
      ...({ 'data-label': label } as object),
      className: nextClass || undefined,
    });
  });

  return (
    <tr
      className={`admin-data-card ${expanded ? 'is-expanded' : 'is-collapsed'} ${className}`.trim()}
      data-card-panel={panelId}
    >
      {cells}
    </tr>
  );
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="admin-row-actions">{children}</div>;
}
