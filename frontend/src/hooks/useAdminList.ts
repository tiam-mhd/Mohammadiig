'use client';

import { useMemo, useState } from 'react';

export type AdminFilterOption = { value: string; label: string };

export function useAdminList<T>(
  items: T[],
  searchText: (item: T) => string,
  matchFilter?: (item: T, filterKey: string, filterValue: string) => boolean,
) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (normalized && !searchText(item).toLowerCase().includes(normalized)) {
        return false;
      }
      if (!matchFilter) return true;
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        return matchFilter(item, key, value);
      });
    });
  }, [items, query, filters, searchText, matchFilter]);

  function setFilter(key: string, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters({});
    setQuery('');
  }

  const activeFilterCount = Object.values(filters).filter((value) => value && value !== 'all').length;

  return {
    query,
    setQuery,
    filters,
    setFilter,
    clearFilters,
    filtersOpen,
    setFiltersOpen,
    filtered,
    activeFilterCount,
    total: items.length,
    shown: filtered.length,
  };
}
