'use client';

import { Toaster } from 'sonner';

export function AdminToaster() {
  return (
    <Toaster
      position="top-center"
      dir="rtl"
      richColors
      closeButton
      gap={10}
      offset={16}
      toastOptions={{
        classNames: {
          toast: 'admin-toast',
          title: 'admin-toast__title',
          closeButton: 'admin-toast__close',
        },
      }}
    />
  );
}
