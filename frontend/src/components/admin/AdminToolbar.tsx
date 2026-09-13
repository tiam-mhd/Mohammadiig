'use client';

import { ReactNode } from 'react';
import type { AdminFilterOption } from '@/hooks/useAdminList';
import {
  IconAction,
  IconClear,
  IconFilter,
  IconPlus,
  IconSearch,
} from '@/components/admin/AdminIcons';

type FilterField = {
  key: string;
  label: string;
  options: AdminFilterOption[];
};

export function AdminToolbar({
  countLabel,
  query,
  onQueryChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  onAdd,
  addLabel = 'افزودن',
  extraActions,
  children,
}: {
  countLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onAdd?: () => void;
  addLabel?: string;
  extraActions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="admin-toolbar">
      <div className="admin-toolbar__row">
        <div className="admin-toolbar__actions">
          {onAdd ? (
            <IconAction label={addLabel} tone="primary" onClick={onAdd}>
              <IconPlus />
            </IconAction>
          ) : null}

          {extraActions}

          <IconAction
            label="فیلتر پیشرفته"
            tone={filtersOpen || activeFilterCount > 0 ? 'primary' : 'ghost'}
            onClick={onToggleFilters}
          >
            <IconFilter />
            {activeFilterCount > 0 ? (
              <span className="admin-toolbar__badge">{activeFilterCount.toLocaleString('fa-IR')}</span>
            ) : null}
          </IconAction>
        </div>

        <label className="admin-search">
          <span className="admin-search__icon" aria-hidden>
            <IconSearch />
          </span>
          <span className="sr-only">جستجو</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="جستجو…"
            className="admin-search__input"
          />
        </label>

        <p className="admin-toolbar__count">{countLabel}</p>
      </div>
      {children}
    </div>
  );
}

export function AdminFilterBar({
  fields,
  values,
  onChange,
  onClear,
}: {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="admin-filters">
      <div className="admin-filters__row">
        <div className="admin-filters__grid">
          {fields.map((field) => (
            <label key={field.key} className="admin-filters__field text-start">
              <span className="ops-login__label">{field.label}</span>
              <select
                className="admin-select admin-select--wide"
                value={values[field.key] ?? 'all'}
                onChange={(event) => onChange(field.key, event.target.value)}
              >
                <option value="all">همه</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <IconAction
          label="پاک‌کردن فیلترها"
          tone="ghost"
          className="admin-filters__clear"
          onClick={onClear}
        >
          <IconClear />
        </IconAction>
      </div>
    </div>
  );
}
