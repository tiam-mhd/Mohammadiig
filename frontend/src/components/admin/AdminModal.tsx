'use client';

import { FormEvent, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconAction, IconClear } from '@/components/admin/AdminIcons';
import { useAdminModalLock } from '@/hooks/useAdminModalLock';

export function AdminModal({
  open,
  title,
  description,
  onClose,
  onSubmit,
  submitLabel = 'ذخیره',
  children,
  busy = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitLabel?: string;
  children: ReactNode;
  busy?: boolean;
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

  const body = (
    <>
      <div className="admin-modal__head text-start">
        <div>
          <h2 className="display-sm">{title}</h2>
          {description ? <p className="mt-2 text-sm text-[var(--ops-muted)]">{description}</p> : null}
        </div>
        <IconAction label="بستن" tone="ghost" onClick={onClose} disabled={busy}>
          <IconClear />
        </IconAction>
      </div>
      <div className="admin-modal__body">{children}</div>
      <div className="admin-modal__foot">
        <button type="button" className="ops-btn ops-btn--ghost" onClick={onClose} disabled={busy}>
          انصراف
        </button>
        {onSubmit ? (
          <button type="submit" className="ops-btn" disabled={busy}>
            {busy ? 'در حال ذخیره…' : submitLabel}
          </button>
        ) : null}
      </div>
    </>
  );

  return createPortal(
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="admin-modal__backdrop" aria-label="بستن" onClick={onClose} />
      {onSubmit ? (
        <form className="admin-modal__panel" onSubmit={onSubmit}>
          {body}
        </form>
      ) : (
        <div className="admin-modal__panel">{body}</div>
      )}
    </div>,
    document.body,
  );
}
