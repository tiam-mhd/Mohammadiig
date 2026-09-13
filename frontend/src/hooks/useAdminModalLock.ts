'use client';

import { useEffect } from 'react';

/** Prevent page scroll jump / white gap when an admin modal is open. */
export function useAdminModalLock(open: boolean) {
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      insetInline: document.body.style.insetInline,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.insetInline = '0';

    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      document.body.style.insetInline = previous.insetInline;
      window.scrollTo(0, scrollY);
    };
  }, [open]);
}

/** True when a nested overlay (media picker / lightbox) should own Escape. */
export function isNestedAdminOverlayOpen(): boolean {
  return Boolean(
    document.querySelector('.media-picker, .media-library__lightbox'),
  );
}
