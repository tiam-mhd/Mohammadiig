'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminFilterBar, AdminToolbar } from '@/components/admin/AdminToolbar';
import {
  IconAction,
  IconClear,
  IconCompress,
  IconDownload,
  IconEye,
  IconImage,
  IconRestore,
  IconSeo,
  IconSliders,
  IconTrash,
  IconVideo,
} from '@/components/admin/AdminIcons';
import { useAdminList } from '@/hooks/useAdminList';
import {
  compressMediaAsset,
  deleteMediaAsset,
  downloadMediaBackup,
  fetchMediaLibrary,
  fetchMediaSettings,
  MediaAsset,
  MediaCompressionSettings,
  purgeMediaAsset,
  restoreMediaAsset,
  restoreMediaBackup,
  updateMediaAsset,
  updateMediaSettings,
  uploadMediaAsset,
} from '@/lib/api-client';
import { formatBytes, isVideoMedia, resolveMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/auth.store';

const defaultSettings: MediaCompressionSettings = {
  quality: 82,
  maxWidth: 1920,
  maxHeight: 1920,
  convertToWebp: true,
  stripMetadata: true,
  compressOnUpload: false,
};

type UploadJob = {
  id: string;
  name: string;
  previewUrl: string;
  kind: 'image' | 'video';
  status: 'uploading' | 'done' | 'error';
};

export default function AdminMediaLibraryPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [compressOpen, setCompressOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadChoiceOpen, setUploadChoiceOpen] = useState(false);
  const [settings, setSettings] = useState<MediaCompressionSettings>(defaultSettings);
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null);
  const [pendingPurge, setPendingPurge] = useState<MediaAsset | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaAsset | null>(null);
  const [message, setMessage] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [seoForm, setSeoForm] = useState({
    originalName: '',
    title: '',
    altText: '',
    caption: '',
    description: '',
    folder: 'general',
  });
  const [compressForm, setCompressForm] = useState({
    mode: 'copy' as 'copy' | 'replace',
    quality: 82,
    maxWidth: 1920,
    maxHeight: 1920,
    convertToWebp: true,
    stripMetadata: true,
  });

  const searchText = useCallback(
    (item: MediaAsset) =>
      `${item.originalName} ${item.title ?? ''} ${item.altText ?? ''} ${item.caption ?? ''} ${item.folder} ${item.mimeType}`,
    [],
  );
  const matchFilter = useCallback((item: MediaAsset, key: string, value: string) => {
    if (key === 'folder') return item.folder === value;
    if (key === 'status') {
      if (value === 'trash') return Boolean(item.deletedAt);
      return !item.deletedAt;
    }
    if (key === 'kind') {
      if (value === 'video') return isVideoMedia(item.mimeType);
      if (value === 'image') return !isVideoMedia(item.mimeType);
    }
    return true;
  }, []);
  const list = useAdminList(items, searchText, matchFilter);

  const statusFilter = list.filters.status || 'active';
  const kindFilter = list.filters.kind || 'all';
  const folderFilter = list.filters.folder || '';

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetchMediaLibrary(token, {
        q: list.query || undefined,
        folder: folderFilter || undefined,
        status: statusFilter === 'trash' ? 'trash' : 'active',
        kind: kindFilter !== 'all' ? kindFilter : undefined,
        limit: 80,
      });
      setItems(res.data);
      setFolders(res.meta.folders);
    } catch {
      setMessage('دریافت کتابخانه رسانه انجام نشد.');
    } finally {
      setBusy(false);
    }
  }, [token, list.query, folderFilter, statusFilter, kindFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
    fetchMediaSettings(token)
      .then(setSettings)
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    return () => {
      for (const job of uploads) URL.revokeObjectURL(job.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!previewItem) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setPreviewItem(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewItem]);

  const folderOptions = useMemo(
    () => folders.map((name) => ({ value: name, label: name })),
    [folders],
  );

  async function onUpload(files: FileList | null, kind: 'image' | 'video') {
    if (!token || !files?.length) return;
    setMessage('');
    const jobs: UploadJob[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      kind,
      status: 'uploading',
    }));
    setUploads((current) => [...jobs, ...current]);

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const job = jobs[index];
      try {
        await uploadMediaAsset(token, file, {
          folder: folderFilter || 'general',
          kind,
        });
        setUploads((current) =>
          current.map((item) => (item.id === job.id ? { ...item, status: 'done' } : item)),
        );
      } catch {
        setUploads((current) =>
          current.map((item) => (item.id === job.id ? { ...item, status: 'error' } : item)),
        );
        setMessage('آپلود برخی فایل‌ها انجام نشد.');
      }
    }

    await load();
    window.setTimeout(() => {
      setUploads((current) => {
        for (const job of current) {
          if (job.status !== 'uploading') URL.revokeObjectURL(job.previewUrl);
        }
        return current.filter((job) => job.status === 'uploading');
      });
    }, 900);
  }

  function chooseUpload(kind: 'image' | 'video') {
    setUploadChoiceOpen(false);
    if (kind === 'image') imageInputRef.current?.click();
    else videoInputRef.current?.click();
  }

  function openSeo(item: MediaAsset) {
    setSelected(item);
    setSeoForm({
      originalName: item.originalName,
      title: item.title ?? '',
      altText: item.altText ?? '',
      caption: item.caption ?? '',
      description: item.description ?? '',
      folder: item.folder || 'general',
    });
    setSeoOpen(true);
  }

  function openCompress(item: MediaAsset) {
    setSelected(item);
    setCompressForm({
      mode: 'copy',
      quality: settings.quality,
      maxWidth: settings.maxWidth,
      maxHeight: settings.maxHeight,
      convertToWebp: settings.convertToWebp,
      stripMetadata: settings.stripMetadata,
    });
    setCompressOpen(true);
  }

  async function saveSeo(event: FormEvent) {
    event.preventDefault();
    if (!token || !selected) return;
    setBusy(true);
    try {
      await updateMediaAsset(token, selected.id, {
        originalName: seoForm.originalName,
        title: seoForm.title || null,
        altText: seoForm.altText || null,
        caption: seoForm.caption || null,
        description: seoForm.description || null,
        folder: seoForm.folder || 'general',
      });
      setSeoOpen(false);
      setMessage('تنظیمات سئو ذخیره شد.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ذخیره سئو انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function saveCompress(event: FormEvent) {
    event.preventDefault();
    if (!token || !selected) return;
    setBusy(true);
    try {
      await compressMediaAsset(token, selected.id, compressForm);
      setCompressOpen(false);
      setMessage(compressForm.mode === 'replace' ? 'تصویر جایگزین شد.' : 'کپی فشرده ساخته شد.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'فشرده‌سازی انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      const next = await updateMediaSettings(token, settings);
      setSettings(next);
      setSettingsOpen(false);
      setMessage('تنظیمات فشرده‌سازی ذخیره شد.');
    } catch {
      setMessage('ذخیره تنظیمات انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!token || !pendingDelete) return;
    setBusy(true);
    try {
      await deleteMediaAsset(token, pendingDelete.id);
      setPendingDelete(null);
      setMessage('به سطل زباله منتقل شد.');
      await load();
    } catch {
      setMessage('حذف انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmPurge() {
    if (!token || !pendingPurge) return;
    setBusy(true);
    try {
      await purgeMediaAsset(token, pendingPurge.id);
      setPendingPurge(null);
      setMessage('برای همیشه حذف شد.');
      await load();
    } catch {
      setMessage('حذف دائم انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function restoreItem(item: MediaAsset) {
    if (!token) return;
    setBusy(true);
    try {
      await restoreMediaAsset(token, item.id);
      setMessage('از سطل زباله بازیابی شد.');
      await load();
    } catch {
      setMessage('بازیابی انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function onBackup() {
    if (!token) return;
    setBusy(true);
    try {
      const blob = await downloadMediaBackup(token);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `media-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(href);
      setMessage('بک‌آپ دانلود شد.');
    } catch {
      setMessage('دانلود بک‌آپ انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  async function onRestoreBackup(files: FileList | null) {
    if (!token || !files?.[0]) return;
    setBusy(true);
    try {
      const result = await restoreMediaBackup(token, files[0]);
      setMessage(`بازیابی شد: ${result.restored} · رد شده: ${result.skipped}`);
      await load();
    } catch {
      setMessage('بازیابی بک‌آپ انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  const uploading = uploads.some((job) => job.status === 'uploading');
  const inTrash = statusFilter === 'trash';

  return (
    <AdminShell title="کتابخانه رسانه" eyebrow="سامانه">
      <AdminToolbar
        countLabel={`${list.shown.toLocaleString('fa-IR')} از ${list.total.toLocaleString('fa-IR')} مورد`}
        query={list.query}
        onQueryChange={list.setQuery}
        filtersOpen={list.filtersOpen}
        onToggleFilters={() => list.setFiltersOpen((open) => !open)}
        activeFilterCount={list.activeFilterCount}
        onAdd={() => setUploadChoiceOpen(true)}
        addLabel="افزودن رسانه"
        extraActions={
          <>
            <IconAction label="تنظیمات حجم" tone="ghost" onClick={() => setSettingsOpen(true)}>
              <IconSliders />
            </IconAction>
            <IconAction label="بک‌آپ" tone="ghost" disabled={busy} onClick={() => void onBackup()}>
              <IconDownload />
            </IconAction>
            <IconAction
              label="بازیابی بک‌آپ"
              tone="ghost"
              disabled={busy}
              onClick={() => restoreInputRef.current?.click()}
            >
              <IconRestore />
            </IconAction>
          </>
        }
      >
        {list.filtersOpen ? (
          <AdminFilterBar
            fields={[
              { key: 'folder', label: 'پوشه', options: folderOptions },
              {
                key: 'kind',
                label: 'نوع',
                options: [
                  { value: 'image', label: 'تصویر' },
                  { value: 'video', label: 'ویدیو' },
                ],
              },
              {
                key: 'status',
                label: 'وضعیت',
                options: [
                  { value: 'active', label: 'فعال' },
                  { value: 'trash', label: 'سطل زباله' },
                ],
              },
            ]}
            values={list.filters}
            onChange={list.setFilter}
            onClear={list.clearFilters}
          />
        ) : null}
      </AdminToolbar>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        disabled={busy || uploading}
        onChange={(e) => {
          void onUpload(e.target.files, 'image');
          e.target.value = '';
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/ogg,.mp4,.webm,.mov,.ogv"
        multiple
        hidden
        disabled={busy || uploading}
        onChange={(e) => {
          void onUpload(e.target.files, 'video');
          e.target.value = '';
        }}
      />
      <input
        ref={restoreInputRef}
        type="file"
        accept=".zip,application/zip"
        hidden
        disabled={busy}
        onChange={(e) => {
          void onRestoreBackup(e.target.files);
          e.target.value = '';
        }}
      />

      {message ? <p className="media-library__msg">{message}</p> : null}

      <section className="media-library" aria-busy={busy || uploading}>
        <div className="media-library__grid">
          {uploads.map((job) => (
            <article
              key={job.id}
              className={`media-library__card media-library__card--upload is-${job.status}`}
            >
              <div className="media-library__thumb">
                {job.kind === 'video' ? (
                  <video src={job.previewUrl} muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.previewUrl} alt={job.name} />
                )}
                <div className="media-library__upload-overlay" aria-live="polite">
                  {job.status === 'uploading' ? (
                    <>
                      <span className="media-library__spinner" />
                      <span>در حال آپلود…</span>
                    </>
                  ) : null}
                  {job.status === 'done' ? <span>آماده</span> : null}
                  {job.status === 'error' ? <span>خطا</span> : null}
                </div>
              </div>
            </article>
          ))}

          {list.filtered.length === 0 && !busy && uploads.length === 0 ? (
            <p className="media-picker__empty">هنوز فایلی در کتابخانه نیست.</p>
          ) : null}

          {list.filtered.map((item) => {
            const src = resolveMediaUrl(item.absoluteUrl || item.url);
            const video = isVideoMedia(item.mimeType);
            return (
              <article key={item.id} className="media-library__card">
                <div className="media-library__thumb">
                  {video ? (
                    <video src={src} muted playsInline preload="metadata" controls={false} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={item.altText || item.originalName} loading="lazy" />
                  )}
                  {video ? <span className="media-library__badge">ویدیو</span> : null}
                  <div className="media-library__card-actions">
                    {!inTrash ? (
                      <>
                        <IconAction label="مشاهده کامل" tone="ghost" onClick={() => setPreviewItem(item)}>
                          <IconEye />
                        </IconAction>
                        <IconAction label="تنظیمات سئو" tone="ghost" onClick={() => openSeo(item)}>
                          <IconSeo />
                        </IconAction>
                        {!video ? (
                          <IconAction label="کاهش حجم" tone="ghost" onClick={() => openCompress(item)}>
                            <IconCompress />
                          </IconAction>
                        ) : null}
                        <IconAction label="حذف" tone="danger" onClick={() => setPendingDelete(item)}>
                          <IconTrash />
                        </IconAction>
                      </>
                    ) : (
                      <>
                        <IconAction label="مشاهده کامل" tone="ghost" onClick={() => setPreviewItem(item)}>
                          <IconEye />
                        </IconAction>
                        <IconAction label="بازیابی" tone="ghost" onClick={() => void restoreItem(item)}>
                          <IconRestore />
                        </IconAction>
                        <IconAction label="حذف دائم" tone="danger" onClick={() => setPendingPurge(item)}>
                          <IconTrash />
                        </IconAction>
                      </>
                    )}
                  </div>
                </div>
                <div className="media-library__card-body text-start">
                  <strong title={item.title || item.originalName}>{item.title || item.originalName}</strong>
                  <small>
                    {formatBytes(item.fileSize)}
                    {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {previewItem ? (
        <div
          className="media-library__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="مشاهده رسانه"
          onClick={() => setPreviewItem(null)}
        >
          <div className="media-library__lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <IconAction
              label="بستن"
              tone="ghost"
              className="media-library__lightbox-close"
              onClick={() => setPreviewItem(null)}
            >
              <IconClear />
            </IconAction>
            <div className="media-library__lightbox-media">
              {isVideoMedia(previewItem.mimeType) ? (
                <video
                  src={resolveMediaUrl(previewItem.absoluteUrl || previewItem.url)}
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(previewItem.absoluteUrl || previewItem.url)}
                  alt={previewItem.altText || previewItem.originalName}
                />
              )}
            </div>
            <div className="media-library__lightbox-meta">
              <strong>{previewItem.title || previewItem.originalName}</strong>
              <small>
                {formatBytes(previewItem.fileSize)}
                {previewItem.width && previewItem.height
                  ? ` · ${previewItem.width}×${previewItem.height}`
                  : ''}
                {previewItem.altText ? ` · ${previewItem.altText}` : ''}
              </small>
            </div>
          </div>
        </div>
      ) : null}

      <AdminModal
        open={uploadChoiceOpen}
        title="افزودن به کتابخانه"
        description="نوع فایل را برای آپلود انتخاب کنید."
        onClose={() => setUploadChoiceOpen(false)}
      >
        <div className="media-upload-choice">
          <button type="button" className="media-upload-choice__btn" onClick={() => chooseUpload('image')}>
            <IconImage />
            <span>آپلود تصویر</span>
            <small>JPG, PNG, WebP, GIF…</small>
          </button>
          <button type="button" className="media-upload-choice__btn" onClick={() => chooseUpload('video')}>
            <IconVideo />
            <span>آپلود ویدیو</span>
            <small>MP4, WebM, MOV…</small>
          </button>
        </div>
      </AdminModal>

      <AdminModal
        open={seoOpen}
        title="تنظیمات سئو"
        description="عنوان، متن جایگزین و توضیحات برای موتورهای جستجو و دسترسی‌پذیری."
        onClose={() => setSeoOpen(false)}
        onSubmit={saveSeo}
        busy={busy}
        submitLabel="ذخیره سئو"
      >
        <div className="admin-form-grid two">
          <label className="block text-start">
            <span className="ops-login__label">نام فایل</span>
            <input
              className="ops-field"
              value={seoForm.originalName}
              onChange={(e) => setSeoForm({ ...seoForm, originalName: e.target.value })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">پوشه</span>
            <input
              className="ops-field"
              value={seoForm.folder}
              onChange={(e) => setSeoForm({ ...seoForm, folder: e.target.value })}
            />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">Title</span>
            <input
              className="ops-field"
              value={seoForm.title}
              onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })}
            />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">Alt text</span>
            <input
              className="ops-field"
              value={seoForm.altText}
              onChange={(e) => setSeoForm({ ...seoForm, altText: e.target.value })}
            />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">Caption</span>
            <input
              className="ops-field"
              value={seoForm.caption}
              onChange={(e) => setSeoForm({ ...seoForm, caption: e.target.value })}
            />
          </label>
          <label className="block text-start sm:col-span-2">
            <span className="ops-login__label">Description</span>
            <textarea
              className="ops-field min-h-24"
              value={seoForm.description}
              onChange={(e) => setSeoForm({ ...seoForm, description: e.target.value })}
            />
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={compressOpen}
        title="کاهش حجم تصویر"
        description="بدون بزرگ‌نمایی؛ کیفیت قابل تنظیم. می‌توانید جایگزین کنید یا کپی بسازید."
        onClose={() => setCompressOpen(false)}
        onSubmit={saveCompress}
        busy={busy}
        submitLabel="اجرای فشرده‌سازی"
      >
        <div className="admin-form-grid two">
          <label className="block text-start">
            <span className="ops-login__label">حالت</span>
            <select
              className="admin-select admin-select--wide"
              value={compressForm.mode}
              onChange={(e) =>
                setCompressForm({ ...compressForm, mode: e.target.value as 'copy' | 'replace' })
              }
            >
              <option value="copy">ذخیره کپی</option>
              <option value="replace">جایگزینی فایل فعلی</option>
            </select>
          </label>
          <label className="block text-start">
            <span className="ops-login__label">کیفیت (۱–۱۰۰)</span>
            <input
              type="number"
              min={1}
              max={100}
              className="ops-field"
              dir="ltr"
              value={compressForm.quality}
              onChange={(e) => setCompressForm({ ...compressForm, quality: Number(e.target.value) })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">حداکثر عرض</span>
            <input
              type="number"
              min={100}
              className="ops-field"
              dir="ltr"
              value={compressForm.maxWidth}
              onChange={(e) => setCompressForm({ ...compressForm, maxWidth: Number(e.target.value) })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">حداکثر ارتفاع</span>
            <input
              type="number"
              min={100}
              className="ops-field"
              dir="ltr"
              value={compressForm.maxHeight}
              onChange={(e) => setCompressForm({ ...compressForm, maxHeight: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--ops-accent)]"
              checked={compressForm.convertToWebp}
              onChange={(e) => setCompressForm({ ...compressForm, convertToWebp: e.target.checked })}
            />
            تبدیل به WebP
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--ops-accent)]"
              checked={compressForm.stripMetadata}
              onChange={(e) => setCompressForm({ ...compressForm, stripMetadata: e.target.checked })}
            />
            حذف متادیتا (EXIF)
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={settingsOpen}
        title="تنظیمات پیش‌فرض فشرده‌سازی"
        description="این مقادیر برای فشرده‌سازی و آپلود خودکار تصاویر استفاده می‌شوند."
        onClose={() => setSettingsOpen(false)}
        onSubmit={saveSettings}
        busy={busy}
        submitLabel="ذخیره تنظیمات"
      >
        <div className="admin-form-grid two">
          <label className="block text-start">
            <span className="ops-login__label">کیفیت پیش‌فرض</span>
            <input
              type="number"
              min={1}
              max={100}
              className="ops-field"
              dir="ltr"
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: Number(e.target.value) })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">حداکثر عرض</span>
            <input
              type="number"
              min={100}
              className="ops-field"
              dir="ltr"
              value={settings.maxWidth}
              onChange={(e) => setSettings({ ...settings, maxWidth: Number(e.target.value) })}
            />
          </label>
          <label className="block text-start">
            <span className="ops-login__label">حداکثر ارتفاع</span>
            <input
              type="number"
              min={100}
              className="ops-field"
              dir="ltr"
              value={settings.maxHeight}
              onChange={(e) => setSettings({ ...settings, maxHeight: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--ops-accent)]"
              checked={settings.convertToWebp}
              onChange={(e) => setSettings({ ...settings, convertToWebp: e.target.checked })}
            />
            WebP پیش‌فرض
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--ops-accent)]"
              checked={settings.stripMetadata}
              onChange={(e) => setSettings({ ...settings, stripMetadata: e.target.checked })}
            />
            حذف متادیتا
          </label>
          <label className="flex items-end gap-3 pb-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--ops-accent)]"
              checked={settings.compressOnUpload}
              onChange={(e) => setSettings({ ...settings, compressOnUpload: e.target.checked })}
            />
            فشرده‌سازی خودکار هنگام آپلود تصویر
          </label>
        </div>
      </AdminModal>

      <AdminConfirmModal
        open={Boolean(pendingDelete)}
        description={`«${pendingDelete?.originalName ?? ''}» به سطل زباله برود؟`}
        confirmLabel="بله، حذف شود"
        busy={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      <AdminConfirmModal
        open={Boolean(pendingPurge)}
        description={`«${pendingPurge?.originalName ?? ''}» برای همیشه حذف شود؟ این کار برگشت‌پذیر نیست.`}
        confirmLabel="حذف دائم"
        busy={busy}
        onClose={() => setPendingPurge(null)}
        onConfirm={confirmPurge}
      />
    </AdminShell>
  );
}
