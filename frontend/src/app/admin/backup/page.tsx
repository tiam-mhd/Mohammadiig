'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import {
  BackupDatasetKey,
  BackupDatasetsResponse,
  BackupInspectResponse,
  BackupRestoreReport,
  BackupDatasetCount,
  RestoreConflictMode,
  downloadSystemBackup,
  fetchBackupDatasets,
  inspectSystemBackup,
  restoreSystemBackup,
} from '@/lib/api-client';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

type Tab = 'export' | 'restore';

const MODE_OPTIONS: Array<{ value: RestoreConflictMode; label: string; hint: string }> = [
  {
    value: 'skip',
    label: 'رد کردن موجودها',
    hint: 'اگر شناسه از قبل باشد، ردیف بک‌آپ نادیده گرفته می‌شود.',
  },
  {
    value: 'overwrite',
    label: 'رونویسی روی موجودها',
    hint: 'ردیف‌های هم‌شناسه به‌روز می‌شوند؛ بقیه اضافه می‌شوند.',
  },
  {
    value: 'replace',
    label: 'جایگزینی کامل بخش',
    hint: 'داده‌های فعلی همان بخش‌ها پاک و از بک‌آپ نوشته می‌شوند.',
  },
];

function groupBy<T extends { groupFa: string }>(items: T[]): Array<{ group: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(item.groupFa) ?? [];
    list.push(item);
    map.set(item.groupFa, list);
  }
  return Array.from(map.entries()).map(([group, groupItems]) => ({ group, items: groupItems }));
}

function DatasetChecklist({
  items,
  selected,
  onToggle,
  onSelectAll,
  onClear,
  disabled,
}: {
  items: Array<{
    key: BackupDatasetKey;
    labelFa: string;
    groupFa: string;
    count: number;
    warningFa?: string | null;
    includesFiles?: boolean;
    descriptionFa?: string;
  }>;
  selected: Set<BackupDatasetKey>;
  onToggle: (key: BackupDatasetKey) => void;
  onSelectAll: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const groups = useMemo(() => groupBy(items), [items]);

  return (
    <div className="backup-checklist">
      <div className="backup-checklist__actions">
        <button type="button" className="ops-btn ops-btn--ghost" disabled={disabled} onClick={onSelectAll}>
          انتخاب همه
        </button>
        <button type="button" className="ops-btn ops-btn--ghost" disabled={disabled} onClick={onClear}>
          پاک کردن انتخاب
        </button>
        <span className="backup-checklist__meta">
          {selected.size.toLocaleString('fa-IR')} از {items.length.toLocaleString('fa-IR')} بخش
        </span>
      </div>
      {groups.map(({ group, items: groupItems }) => (
        <section key={group} className="backup-group text-start">
          <h3 className="backup-group__title">{group}</h3>
          <div className="backup-group__grid">
            {groupItems.map((item) => {
              const checked = selected.has(item.key);
              return (
                <label key={item.key} className={`backup-item${checked ? ' is-checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggle(item.key)}
                  />
                  <span className="backup-item__body">
                    <span className="backup-item__label">{item.labelFa}</span>
                    <span className="backup-item__count">
                      {item.count.toLocaleString('fa-IR')} رکورد
                      {item.includesFiles ? ' · فایل' : ''}
                    </span>
                    {item.descriptionFa ? (
                      <span className="backup-item__desc">{item.descriptionFa}</span>
                    ) : null}
                    {item.warningFa ? <span className="backup-item__warn">{item.warningFa}</span> : null}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function ReportView({ report }: { report: BackupRestoreReport }) {
  const totals = report.tables.reduce(
    (acc, row) => {
      acc.inserted += row.inserted;
      acc.updated += row.updated;
      acc.skipped += row.skipped;
      acc.cleared += row.cleared;
      acc.errors += row.errors.length;
      return acc;
    },
    { inserted: 0, updated: 0, skipped: 0, cleared: 0, errors: 0 },
  );

  return (
    <div className="backup-report text-start">
      <div className="backup-report__head">
        <p className="caption-up">{report.dryRun ? 'پیش‌نمایش (اعمال نشده)' : 'نتیجه بازیابی'}</p>
        <p className="mt-1 text-sm text-[var(--ops-muted)]">
          حالت: {MODE_OPTIONS.find((m) => m.value === report.mode)?.label ?? report.mode}
        </p>
      </div>
      <div className="admin-stat-grid backup-report__stats">
        <div className="admin-stat text-start">
          <p className="caption-up">افزوده</p>
          <p className="admin-stat__value">{totals.inserted.toLocaleString('fa-IR')}</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">به‌روز</p>
          <p className="admin-stat__value">{totals.updated.toLocaleString('fa-IR')}</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">رد شده</p>
          <p className="admin-stat__value">{totals.skipped.toLocaleString('fa-IR')}</p>
        </div>
        <div className="admin-stat text-start">
          <p className="caption-up">پاک‌شده</p>
          <p className="admin-stat__value">{totals.cleared.toLocaleString('fa-IR')}</p>
        </div>
      </div>
      {(report.mediaFilesRestored > 0 || report.mediaFilesSkipped > 0) && (
        <p className="mt-3 text-sm text-[var(--ops-muted)]">
          فایل‌های رسانه: {report.mediaFilesRestored.toLocaleString('fa-IR')} بازیابی ·{' '}
          {report.mediaFilesSkipped.toLocaleString('fa-IR')} رد شده
        </p>
      )}
      {report.warnings.length > 0 && (
        <ul className="backup-report__warnings">
          {report.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      <div className="backup-report__table-wrap">
        <table className="backup-report__table">
          <thead>
            <tr>
              <th>جدول</th>
              <th>افزوده</th>
              <th>به‌روز</th>
              <th>رد</th>
              <th>پاک</th>
            </tr>
          </thead>
          <tbody>
            {report.tables.map((row) => (
              <tr key={row.table}>
                <td>{row.table}</td>
                <td>{row.inserted.toLocaleString('fa-IR')}</td>
                <td>{row.updated.toLocaleString('fa-IR')}</td>
                <td>{row.skipped.toLocaleString('fa-IR')}</td>
                <td>{row.cleared.toLocaleString('fa-IR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totals.errors > 0 && (
        <details className="mt-3">
          <summary>خطاهای جزئی ({totals.errors.toLocaleString('fa-IR')})</summary>
          <ul className="backup-report__errors">
            {report.tables.flatMap((row) =>
              row.errors.map((err) => (
                <li key={`${row.table}-${err}`}>
                  {row.table}: {err}
                </li>
              )),
            )}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function AdminBackupPage() {
  const token = useAuthStore((s) => s.accessToken);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('export');
  const [counts, setCounts] = useState<BackupDatasetCount[]>([]);
  const [definitions, setDefinitions] = useState<BackupDatasetsResponse['definitions']>([]);
  const [exportSelected, setExportSelected] = useState<Set<BackupDatasetKey>>(new Set());
  const [includeSoftDeleted, setIncludeSoftDeleted] = useState(true);
  const [includeMediaFiles, setIncludeMediaFiles] = useState(true);
  const [busy, setBusy] = useState(false);

  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [inspect, setInspect] = useState<BackupInspectResponse | null>(null);
  const [restoreSelected, setRestoreSelected] = useState<Set<BackupDatasetKey>>(new Set());
  const [mode, setMode] = useState<RestoreConflictMode>('skip');
  const [restoreMediaFiles, setRestoreMediaFiles] = useState(true);
  const [protectCurrentAdmin, setProtectCurrentAdmin] = useState(true);
  const [report, setReport] = useState<BackupRestoreReport | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  async function loadCounts() {
    if (!token) return;
    try {
      const data = await fetchBackupDatasets(token);
      setCounts(data.counts);
      setDefinitions(data.definitions);
      if (exportSelected.size === 0) {
        setExportSelected(new Set(data.counts.map((c) => c.key)));
      }
    } catch {
      adminToast.error('دریافت فهرست بخش‌ها انجام نشد.');
    }
  }

  useEffect(() => {
    void loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const exportItems = useMemo(() => {
    return counts.map((c) => {
      const def = definitions.find((d) => d.key === c.key);
      return {
        key: c.key,
        labelFa: c.labelFa,
        groupFa: c.groupFa,
        count: c.count,
        warningFa: c.warningFa,
        includesFiles: c.includesFiles,
        descriptionFa: def?.descriptionFa,
      };
    });
  }, [counts, definitions]);

  const restoreItems = useMemo(() => {
    if (!inspect) return [];
    return inspect.availableDatasets.map((d) => ({
      key: d.key,
      labelFa: d.labelFa,
      groupFa: d.groupFa,
      count: d.count,
      warningFa: d.warningFa,
      includesFiles: d.includesFiles,
    }));
  }, [inspect]);

  function toggle(set: Set<BackupDatasetKey>, key: BackupDatasetKey, setter: (s: Set<BackupDatasetKey>) => void) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  }

  async function onExport() {
    if (!token || exportSelected.size === 0) {
      adminToast.error('حداقل یک بخش را انتخاب کنید.');
      return;
    }
    setBusy(true);
    try {
      const blob = await downloadSystemBackup(token, {
        datasets: Array.from(exportSelected),
        includeSoftDeleted,
        includeMediaFiles,
      });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `mig-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(href);
      adminToast.success('فایل پشتیبان دانلود شد.');
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'ساخت بک‌آپ انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(files: FileList | null) {
    const file = files?.[0];
    if (!file || !token) return;
    setBackupFile(file);
    setReport(null);
    setBusy(true);
    try {
      const data = await inspectSystemBackup(token, file);
      setInspect(data);
      setRestoreSelected(new Set(data.availableDatasets.map((d) => d.key)));
      adminToast.success('فایل بک‌آپ خوانده شد.');
    } catch (error) {
      setInspect(null);
      setBackupFile(null);
      adminToast.error(error instanceof Error ? error.message : 'خواندن بک‌آپ انجام نشد.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function runRestore(dryRun: boolean) {
    if (!token || !backupFile) return;
    if (restoreSelected.size === 0) {
      adminToast.error('حداقل یک بخش برای بازیابی انتخاب کنید.');
      return;
    }
    setBusy(true);
    try {
      const result = await restoreSystemBackup(token, backupFile, {
        datasets: Array.from(restoreSelected),
        mode,
        dryRun,
        restoreMediaFiles,
        protectCurrentAdmin,
      });
      setReport(result);
      if (dryRun) {
        adminToast.success('پیش‌نمایش آماده است؛ هنوز چیزی اعمال نشده.');
      } else {
        adminToast.success('بازیابی انجام شد.');
        await loadCounts();
      }
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'بازیابی انجام نشد.');
    } finally {
      setBusy(false);
      setConfirmRestore(false);
    }
  }

  return (
    <AdminShell eyebrow="سامانه" title="پشتیبان‌گیری و بازیابی">
      <div className="backup-page text-start">
        <p className="backup-intro">
          از اینجا می‌توانید بخش‌های دلخواه دیتابیس (و در صورت نیاز فایل‌های رسانه) را در یک فایل ZIP ذخیره کنید یا از
          بک‌آپ قبلی با کنترل رونویسی بازگردانی کنید.
        </p>

        <div className="backup-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'export'}
            className={`backup-tabs__btn${tab === 'export' ? ' is-active' : ''}`}
            onClick={() => setTab('export')}
          >
            ساخت پشتیبان
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'restore'}
            className={`backup-tabs__btn${tab === 'restore' ? ' is-active' : ''}`}
            onClick={() => setTab('restore')}
          >
            خواندن / بازیابی
          </button>
        </div>

        {tab === 'export' ? (
          <section className="backup-panel">
            <header className="backup-panel__head">
              <h2 className="display-sm">انتخاب داده‌ها برای پشتیبان</h2>
              <p className="mt-2 text-sm text-[var(--ops-muted)]">
                همه را انتخاب کنید یا فقط بخش‌های مورد نیاز را. فایل ZIP روی دستگاه شما دانلود می‌شود.
              </p>
            </header>

            <DatasetChecklist
              items={exportItems}
              selected={exportSelected}
              disabled={busy}
              onToggle={(key) => toggle(exportSelected, key, setExportSelected)}
              onSelectAll={() => setExportSelected(new Set(exportItems.map((i) => i.key)))}
              onClear={() => setExportSelected(new Set())}
            />

            <div className="backup-options">
              <label className="backup-switch">
                <input
                  type="checkbox"
                  checked={includeSoftDeleted}
                  disabled={busy}
                  onChange={(e) => setIncludeSoftDeleted(e.target.checked)}
                />
                <span>شامل ردیف‌های حذف‌شده (soft-delete)</span>
              </label>
              <label className="backup-switch">
                <input
                  type="checkbox"
                  checked={includeMediaFiles}
                  disabled={busy || !exportSelected.has('media')}
                  onChange={(e) => setIncludeMediaFiles(e.target.checked)}
                />
                <span>پیوست کردن فایل‌های واقعی کتابخانه رسانه داخل ZIP</span>
              </label>
            </div>

            <div className="backup-panel__foot">
              <button type="button" className="ops-btn" disabled={busy || exportSelected.size === 0} onClick={() => void onExport()}>
                {busy ? 'در حال آماده‌سازی…' : 'دانلود فایل پشتیبان'}
              </button>
            </div>
          </section>
        ) : (
          <section className="backup-panel">
            <header className="backup-panel__head">
              <h2 className="display-sm">بارگذاری فایل پشتیبان</h2>
              <p className="mt-2 text-sm text-[var(--ops-muted)]">
                ابتدا فایل ZIP را بخوانید تا ببینید چه بخش‌هایی داخل آن است؛ سپس انتخاب کنید چه چیزی بازیابی شود.
              </p>
            </header>

            <div className="backup-upload">
              <input
                ref={fileRef}
                type="file"
                accept=".zip,application/zip"
                hidden
                onChange={(e) => void onPickFile(e.target.files)}
              />
              <button
                type="button"
                className="ops-btn ops-btn--ghost"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                انتخاب فایل ZIP
              </button>
              {backupFile ? (
                <span className="backup-upload__name">
                  {backupFile.name} · {(backupFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              ) : (
                <span className="backup-upload__name text-[var(--ops-muted)]">هنوز فایلی انتخاب نشده</span>
              )}
            </div>

            {inspect && (
              <>
                <div className="backup-manifest">
                  <p>
                    تاریخ ساخت: {new Date(inspect.manifest.createdAt).toLocaleString('fa-IR')}
                  </p>
                  <p>
                    نسخه قالب: {inspect.manifest.version} ·{' '}
                    {inspect.manifest.includeMediaFiles ? 'شامل فایل رسانه' : 'بدون فایل رسانه'}
                  </p>
                  {inspect.manifest.notes?.map((note) => (
                    <p key={note} className="backup-item__warn">
                      {note}
                    </p>
                  ))}
                </div>

                <DatasetChecklist
                  items={restoreItems}
                  selected={restoreSelected}
                  disabled={busy}
                  onToggle={(key) => toggle(restoreSelected, key, setRestoreSelected)}
                  onSelectAll={() => setRestoreSelected(new Set(restoreItems.map((i) => i.key)))}
                  onClear={() => setRestoreSelected(new Set())}
                />

                <div className="backup-modes">
                  <p className="caption-up">مدیریت تداخل / رونویسی</p>
                  <div className="backup-modes__grid">
                    {MODE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`backup-mode${mode === option.value ? ' is-checked' : ''}`}
                      >
                        <input
                          type="radio"
                          name="restore-mode"
                          checked={mode === option.value}
                          disabled={busy}
                          onChange={() => setMode(option.value)}
                        />
                        <span>
                          <strong>{option.label}</strong>
                          <small>{option.hint}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="backup-options">
                  <label className="backup-switch">
                    <input
                      type="checkbox"
                      checked={restoreMediaFiles}
                      disabled={busy || !restoreSelected.has('media')}
                      onChange={(e) => setRestoreMediaFiles(e.target.checked)}
                    />
                    <span>بازیابی فایل‌های رسانه از داخل ZIP</span>
                  </label>
                  <label className="backup-switch">
                    <input
                      type="checkbox"
                      checked={protectCurrentAdmin}
                      disabled={busy}
                      onChange={(e) => setProtectCurrentAdmin(e.target.checked)}
                    />
                    <span>محافظت از حساب ادمین فعلی (جلوگیری از قفل شدن ورود)</span>
                  </label>
                </div>

                <div className="backup-panel__foot backup-panel__foot--split">
                  <button
                    type="button"
                    className="ops-btn ops-btn--ghost"
                    disabled={busy || restoreSelected.size === 0}
                    onClick={() => void runRestore(true)}
                  >
                    پیش‌نمایش (بدون اعمال)
                  </button>
                  <button
                    type="button"
                    className="ops-btn ops-btn--danger"
                    disabled={busy || restoreSelected.size === 0}
                    onClick={() => setConfirmRestore(true)}
                  >
                    اعمال بازیابی
                  </button>
                </div>
              </>
            )}

            {report && <ReportView report={report} />}
          </section>
        )}
      </div>

      <AdminConfirmModal
        open={confirmRestore}
        title="تأیید بازیابی"
        description={
          mode === 'replace'
            ? 'حالت جایگزینی، داده‌های فعلی بخش‌های انتخاب‌شده را پاک می‌کند و از بک‌آپ می‌نویسد. این کار برگشت‌ناپذیر است مگر بک‌آپ تازه داشته باشید.'
            : mode === 'overwrite'
              ? 'ردیف‌های هم‌شناسه با دادهٔ بک‌آپ رونویسی می‌شوند. ادامه می‌دهید؟'
              : 'فقط ردیف‌های جدید اضافه می‌شوند و موجودها دست نمی‌خورند. ادامه می‌دهید؟'
        }
        confirmLabel="بازیابی کن"
        busyLabel="در حال بازیابی…"
        busy={busy}
        onClose={() => setConfirmRestore(false)}
        onConfirm={() => void runRestore(false)}
      />
    </AdminShell>
  );
}
