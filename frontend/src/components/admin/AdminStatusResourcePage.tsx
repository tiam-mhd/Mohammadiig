"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminConfirmModal } from "@/components/admin/AdminConfirmModal";
import { AdminModal } from "@/components/admin/AdminModal";
import { DataRow, DataTable, RowActions } from "@/components/admin/DataTable";
import { AdminFilterBar, AdminToolbar } from "@/components/admin/AdminToolbar";
import { IconAction, IconEdit, IconTrash } from "@/components/admin/AdminIcons";
import { useAdminList } from "@/hooks/useAdminList";
import { labelOf } from "@/lib/admin-labels";
import { adminToast } from "@/lib/admin-toast";
import { useAuthStore } from "@/store/auth.store";

type StatusOption = { value: string; label: string };
type ServerPage<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

type Column<T> = {
  header: string;
  cell: (item: T) => ReactNode;
};

export function AdminStatusResourcePage<T extends { id: string }>({
  eyebrow,
  title,
  resourceLabel,
  headers,
  columns,
  statusMap,
  statusOptions,
  getStatus,
  searchText,
  fetchItems,
  fetchPage,
  updateStatus,
  cancelStatus,
  addHint,
}: {
  eyebrow: string;
  title: string;
  resourceLabel: string;
  headers: string[];
  columns: Column<T>[];
  statusMap: Record<string, string>;
  statusOptions: StatusOption[];
  getStatus: (item: T) => string;
  searchText: (item: T) => string;
  fetchItems: (token: string) => Promise<T[]>;
  fetchPage?: (
    token: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      sort?: string;
      order?: "asc" | "desc";
    },
  ) => Promise<ServerPage<T>>;
  updateStatus: (token: string, id: string, status: string) => Promise<T>;
  cancelStatus: string;
  addHint: string;
}) {
  const token = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<T[]>([]);
  const [editing, setEditing] = useState<T | null>(null);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [statusValue, setStatusValue] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverMeta, setServerMeta] = useState<ServerPage<T>["meta"] | null>(
    null,
  );
  const [sort, setSort] = useState<"newest" | "oldest" | "az">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const search = searchText;
  const matchFilter = useCallback(
    (item: T, key: string, value: string) =>
      key === "status" ? getStatus(item) === value : true,
    [getStatus],
  );
  const list = useAdminList(items, search, matchFilter);
  const pageCount = Math.max(
    1,
    serverMeta?.totalPages ?? Math.ceil(list.filtered.length / pageSize),
  );
  const sortedItems = [...list.filtered].sort((a, b) => {
    if (sort === "az") return searchText(a).localeCompare(searchText(b), "fa");
    const av = (a as T & { createdAt?: string }).createdAt ?? "";
    const bv = (b as T & { createdAt?: string }).createdAt ?? "";
    return sort === "newest" ? bv.localeCompare(av) : av.localeCompare(bv);
  });
  const visibleItems = fetchPage
    ? items
    : sortedItems.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [list.query, JSON.stringify(list.filters)]);

  useEffect(() => {
    if (!token) return;
    setLoadError(false);
    setLoading(true);
    const request = fetchPage
      ? fetchPage(token, {
          page,
          limit: pageSize,
          search: list.query,
          sort: "createdAt",
          order: sort === "oldest" ? "asc" : "desc",
        }).then((result) => {
          setItems(result.data);
          setServerMeta(result.meta);
        })
      : fetchItems(token).then((result) => {
          setItems(result);
          setServerMeta(null);
        });
    request
      .catch(() => {
        setLoadError(true);
        adminToast.error(`دریافت ${resourceLabel} انجام نشد.`);
      })
      .finally(() => setLoading(false));
  }, [token, fetchItems, fetchPage, resourceLabel, page, list.query, sort]);

  function openEdit(item: T) {
    setEditing(item);
    setStatusValue(getStatus(item));
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!token || !editing) return;
    setBusy(true);
    try {
      const updated = await updateStatus(token, editing.id, statusValue);
      setItems((current) =>
        current.map((item) => (item.id === editing.id ? updated : item)),
      );
      setEditing(null);
      adminToast.success(`${resourceLabel} به‌روزرسانی شد.`);
    } catch (error) {
      adminToast.error(
        error instanceof Error ? error.message : "ویرایش انجام نشد.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      const updated = await updateStatus(token, pendingDelete.id, cancelStatus);
      setItems((current) =>
        current.map((row) => (row.id === pendingDelete.id ? updated : row)),
      );
      setPendingDelete(null);
      adminToast.success(`${resourceLabel} لغو شد.`);
    } catch (error) {
      adminToast.error(
        error instanceof Error ? error.message : "حذف انجام نشد.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell eyebrow={eyebrow} title={title}>
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString("fa-IR")} از ${list.total.toLocaleString("fa-IR")} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => setAddOpen(true)}
        addLabel={`افزودن ${resourceLabel}`}
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[{ key: "status", label: "وضعیت", options: statusOptions }]}
            values={list.filters}
            onChange={list.setFilter}
            onClear={list.clearFilters}
          />
        ) : null}
      </AdminToolbar>
      <div className="mb-3 flex justify-end">
        <label className="flex items-center gap-2 text-sm text-[var(--ops-muted)]">
          مرتب‌سازی
          <select
            className="admin-select"
            value={sort}
            onChange={(e) => {
              const value = e.target.value as typeof sort;
              setSort(value);
              setPage(1);
            }}
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="az">الفبایی</option>
          </select>
        </label>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          دریافت {resourceLabel} انجام نشد.{" "}
          <button
            className="mr-2 underline"
            onClick={() =>
              token &&
              (fetchPage
                ? fetchPage(token, {
                    page,
                    limit: pageSize,
                    search: list.query,
                  }).then((result) => {
                    setItems(result.data);
                    setServerMeta(result.meta);
                  })
                : fetchItems(token).then(setItems)
              )
                .then(() => setLoadError(false))
                .catch(() => undefined)
            }
          >
            تلاش دوباره
          </button>
        </div>
      ) : null}
      {loading ? (
        <div className="mb-3 rounded-xl border border-[var(--ops-line)] bg-white p-4 text-sm text-[var(--ops-muted)]">
          در حال دریافت {resourceLabel}…
        </div>
      ) : null}
      <DataTable
        headers={[...headers, "وضعیت", "عملیات"]}
        isEmpty={visibleItems.length === 0 && !loading}
        loading={loading}
        emptyText={`${resourceLabel}ی با این جستجو پیدا نشد.`}
      >
        {visibleItems.map((item) => (
          <DataRow key={item.id}>
            {columns.map((column) => (
              <td key={column.header} className="text-start">
                {column.cell(item)}
              </td>
            ))}
            <td>
              <span className="admin-badge">
                {labelOf(statusMap, getStatus(item))}
              </span>
            </td>
            <td>
              <RowActions>
                <IconAction label="ویرایش" onClick={() => openEdit(item)}>
                  <IconEdit />
                </IconAction>
                <IconAction
                  label="حذف"
                  tone="danger"
                  onClick={() => setPendingDelete(item)}
                >
                  <IconTrash />
                </IconAction>
              </RowActions>
            </td>
          </DataRow>
        ))}
      </DataTable>
      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          className="admin-button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          قبلی
        </button>
        <span>
          {(serverMeta?.total ?? list.total).toLocaleString("fa-IR")} مورد ·
          صفحه {page.toLocaleString("fa-IR")} از{" "}
          {pageCount.toLocaleString("fa-IR")}
        </span>
        <button
          className="admin-button"
          disabled={page >= pageCount || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          بعدی
        </button>
      </div>

      <AdminModal
        open={Boolean(editing)}
        title={`ویرایش ${resourceLabel}`}
        description="وضعیت را تغییر دهید و ذخیره کنید."
        onClose={() => setEditing(null)}
        onSubmit={saveEdit}
        busy={busy}
        submitLabel="ذخیره وضعیت"
      >
        <label className="block text-start">
          <span className="ops-login__label">وضعیت</span>
          <select
            className="admin-select admin-select--wide"
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </AdminModal>

      <AdminModal
        open={addOpen}
        title={`افزودن ${resourceLabel}`}
        description={addHint}
        onClose={() => setAddOpen(false)}
      >
        <p className="text-sm leading-relaxed text-[var(--ops-muted)]">
          {addHint}
        </p>
        <p className="mt-3 text-sm text-[var(--ops-ink-soft)]">
          پس از ایجاد از مسیر مشتری، می‌توانید از همین صفحه وضعیت را ویرایش یا
          لغو کنید.
        </p>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        title={`لغو ${resourceLabel}`}
        description={`این ${resourceLabel} لغو / حذف شود؟`}
        confirmLabel="بله، حذف شود"
        busy={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
