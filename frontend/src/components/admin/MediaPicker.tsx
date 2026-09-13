'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconAction, IconClear, IconImage, IconPlus, IconVideo } from '@/components/admin/AdminIcons';
import { useAdminModalLock } from '@/hooks/useAdminModalLock';
import {
  fetchMediaLibrary,
  MediaAsset,
  uploadMediaAsset,
} from '@/lib/api-client';
import { formatBytes, isVideoMedia, resolveMediaUrl } from '@/lib/media';
import { adminToast } from '@/lib/admin-toast';
import { useAuthStore } from '@/store/auth.store';

function pickUrl(asset: MediaAsset): string {
  return resolveMediaUrl(asset.absoluteUrl || asset.url);
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  accept = 'all',
  title = 'انتخاب از کتابخانه رسانه',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (urls: string[], assets: MediaAsset[]) => void;
  multiple?: boolean;
  accept?: 'all' | 'image' | 'video';
  title?: string;
}) {
  const token = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [folder, setFolder] = useState('');
  const [selected, setSelected] = useState<Record<string, MediaAsset>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !uploading) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, uploading]);

  useAdminModalLock(open);

  const load = useCallback(async () => {
    if (!token || !open) return;
    setBusy(true);
    try {
      const res = await fetchMediaLibrary(token, {
        q: q || undefined,
        folder: folder || undefined,
        status: 'active',
        kind: accept === 'all' ? undefined : accept,
        limit: 60,
      });
      setItems(res.data);
      setFolders(res.meta.folders);
    } catch {
      adminToast.error('دریافت کتابخانه رسانه انجام نشد.');
    } finally {
      setBusy(false);
    }
  }, [token, open, q, folder, accept]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) {
      setSelected({});
      setQ('');
      setFolder('');
      setChoiceOpen(false);
    }
  }, [open]);

  const selectedList = useMemo(() => Object.values(selected), [selected]);

  function toggle(asset: MediaAsset) {
    setSelected((current) => {
      if (!multiple) return { [asset.id]: asset };
      const next = { ...current };
      if (next[asset.id]) delete next[asset.id];
      else next[asset.id] = asset;
      return next;
    });
  }

  async function onUpload(files: FileList | null, kind: 'image' | 'video') {
    if (!token || !files?.length) return;
    setUploading(true);
    try {
      const uploaded: MediaAsset[] = [];
      for (const file of Array.from(files)) {
        const asset = await uploadMediaAsset(token, file, { folder: folder || 'general', kind });
        uploaded.push(asset);
      }
      setItems((current) => [...uploaded, ...current]);
      if (!multiple && uploaded[0]) {
        setSelected({ [uploaded[0].id]: uploaded[0] });
      } else {
        setSelected((current) => {
          const next = { ...current };
          for (const asset of uploaded) next[asset.id] = asset;
          return next;
        });
      }
      adminToast.success(`${uploaded.length} فایل آپلود شد.`);
    } catch (error) {
      adminToast.error(error instanceof Error ? error.message : 'آپلود انجام نشد.');
    } finally {
      setUploading(false);
    }
  }

  function startUpload() {
    if (accept === 'image') {
      imageInputRef.current?.click();
      return;
    }
    if (accept === 'video') {
      videoInputRef.current?.click();
      return;
    }
    setChoiceOpen(true);
  }

  function chooseUpload(kind: 'image' | 'video') {
    setChoiceOpen(false);
    if (kind === 'image') imageInputRef.current?.click();
    else videoInputRef.current?.click();
  }

  function confirm(event?: FormEvent) {
    event?.preventDefault();
    if (!selectedList.length) return;
    onSelect(selectedList.map(pickUrl), selectedList);
    onClose();
  }

  if (!open || typeof document === 'undefined') return null;

  const body = (
    <div className="media-picker" role="dialog" aria-modal="true" aria-label={title}>
      <div className="media-picker__panel">
        <div className="admin-modal__head text-start">
          <div>
            <h2 className="display-sm">{title}</h2>
            <p className="mt-2 text-sm text-[var(--ops-muted)]">
              فایل موجود را انتخاب کنید یا ابتدا آپلود کنید.
            </p>
          </div>
          <IconAction label="بستن" tone="ghost" onClick={onClose} disabled={uploading}>
            <IconClear />
          </IconAction>
        </div>

        <div className="media-picker__toolbar">
          <input
            className="ops-field"
            placeholder="جستجو در نام، عنوان، alt…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="admin-select" value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="">همه پوشه‌ها</option>
            {folders.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <IconAction label="آپلود فایل" tone="primary" disabled={uploading} onClick={startUpload}>
            <IconPlus />
          </IconAction>
        </div>

        {choiceOpen ? (
          <div className="media-upload-choice media-upload-choice--picker">
            <button type="button" className="media-upload-choice__btn" onClick={() => chooseUpload('image')}>
              <IconImage />
              <span>آپلود تصویر</span>
            </button>
            <button type="button" className="media-upload-choice__btn" onClick={() => chooseUpload('video')}>
              <IconVideo />
              <span>آپلود ویدیو</span>
            </button>
          </div>
        ) : null}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={uploading}
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
          disabled={uploading}
          onChange={(e) => {
            void onUpload(e.target.files, 'video');
            e.target.value = '';
          }}
        />

        <div className="media-picker__grid" aria-busy={busy}>
          {items.length === 0 && !busy ? (
            <p className="media-picker__empty">کتابخانه خالی است — اول یک فایل آپلود کنید.</p>
          ) : null}
          {items.map((item) => {
            const active = Boolean(selected[item.id]);
            const src = pickUrl(item);
            const video = isVideoMedia(item.mimeType);
            return (
              <button
                key={item.id}
                type="button"
                className={`media-picker__card ${active ? 'is-selected' : ''}`}
                onClick={() => toggle(item)}
                onDoubleClick={() => {
                  onSelect([pickUrl(item)], [item]);
                  onClose();
                }}
              >
                {video ? (
                  <video src={src} muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={item.altText || item.originalName} />
                )}
                <span className="media-picker__card-meta">
                  <strong>{item.title || item.originalName}</strong>
                  <small>
                    {formatBytes(item.fileSize)}
                    {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                    {video ? ' · ویدیو' : ''}
                  </small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="admin-modal__foot">
          <button type="button" className="ops-btn ops-btn--ghost" onClick={onClose} disabled={uploading}>
            انصراف
          </button>
          <button
            type="button"
            className="ops-btn"
            disabled={!selectedList.length || uploading}
            onClick={() => confirm()}
          >
            {multiple
              ? selectedList.length
                ? `انتخاب ${selectedList.length.toLocaleString('fa-IR')} مورد`
                : 'انتخاب'
              : 'انتخاب'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
