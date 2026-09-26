"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type AdminFilterOption = { value: string; label: string };

export function useAdminList<T>(
  items: T[],
  searchText: (item: T) => string,
  matchFilter?: (item: T, filterKey: string, filterValue: string) => boolean,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQueryState] = useState(() => searchParams.get("q") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFiltersState] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Array.from(searchParams.entries()).filter(
        ([key]) => key !== "q" && key !== "page",
      ),
    ),
  );
  const setQuery = (value: string) => {
    setQueryState(value);
    const next = new URLSearchParams(searchParams.toString());
    if (value.trim()) next.set("q", value);
    else next.delete("q");
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (normalized && !searchText(item).toLowerCase().includes(normalized)) {
        return false;
      }
      if (!matchFilter) return true;
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === "all") return true;
        return matchFilter(item, key, value);
      });
    });
  }, [items, query, filters, searchText, matchFilter]);

  function setFilter(key: string, value: string) {
    setFiltersState((current) => ({ ...current, [key]: value }));
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function clearFilters() {
    setFiltersState({});
    setQuery("");
  }

  const activeFilterCount = Object.values(filters).filter(
    (value) => value && value !== "all",
  ).length;

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
