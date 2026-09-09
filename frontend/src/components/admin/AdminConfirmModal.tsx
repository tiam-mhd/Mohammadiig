'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconAction, IconClear } from '@/components/admin/AdminIcons';
import { useAdminModalLock } from '@/hooks/useAdminModalLock';

export function AdminConfirmModal({
  open,
  title = 'تأیید حذف',
  description,
  confirmLabel = 'حذف',
  busyLabel = 'در حال حذف…',
  busy = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  useAdminModalLock(open);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, busy]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="admin-modal__backdrop"
        aria-label="بستن"
        onClick={busy ? undefined : onClose}
      />
      <div className="admin-modal__panel">
        <div className="admin-modal__head text-start">
          <div>
            <h2 className="display-sm">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ops-muted)]">{description}</p>
          </div>
          <IconAction label="بستن" tone="ghost" onClick={onClose} disabled={busy}>
            <IconClear />
          </IconAction>
        </div>
        <div className="admin-modal__foot">
          <button type="button" className="ops-btn ops-btn--ghost" onClick={onClose} disabled={busy}>
            انصراف
          </button>
          <button type="button" className="ops-btn ops-btn--danger" onClick={() => void onConfirm()} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
