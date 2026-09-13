'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

export function AdminIcon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={`admin-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconSearch() {
  return (
    <AdminIcon>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </AdminIcon>
  );
}

export function IconFilter() {
  return (
    <AdminIcon>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </AdminIcon>
  );
}

export function IconPlus() {
  return (
    <AdminIcon>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </AdminIcon>
  );
}

export function IconEdit() {
  return (
    <AdminIcon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </AdminIcon>
  );
}

export function IconTrash() {
  return (
    <AdminIcon>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </AdminIcon>
  );
}

export function IconEye() {
  return (
    <AdminIcon>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </AdminIcon>
  );
}

export function IconEyeOff() {
  return (
    <AdminIcon>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c6 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="m1 1 22 22" />
    </AdminIcon>
  );
}

export function IconClear() {
  return (
    <AdminIcon>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </AdminIcon>
  );
}

export function IconUpload() {
  return (
    <AdminIcon>
      <path d="M12 16V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M4 19h16" />
    </AdminIcon>
  );
}

export function IconDownload() {
  return (
    <AdminIcon>
      <path d="M12 5v11" />
      <path d="m8 12 4 4 4-4" />
      <path d="M4 19h16" />
    </AdminIcon>
  );
}

export function IconRestore() {
  return (
    <AdminIcon>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </AdminIcon>
  );
}

export function IconSliders() {
  return (
    <AdminIcon>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M2 14h4" />
      <path d="M10 8h4" />
      <path d="M18 16h4" />
    </AdminIcon>
  );
}

export function IconFolder() {
  return (
    <AdminIcon>
      <path d="M3 7h7l2 3h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </AdminIcon>
  );
}

export function IconSeo() {
  return (
    <AdminIcon>
      <path d="M20.6 13.4 13 21a2 2 0 0 1-2.8 0L3 13.8a2 2 0 0 1 0-2.8L10.6 3.4a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v6.6a2 2 0 0 1-.6 1.4z" />
      <circle cx="16.5" cy="7.5" r="1.2" />
    </AdminIcon>
  );
}

export function IconCompress() {
  return (
    <AdminIcon>
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <path d="m14 10 7-7" />
      <path d="m3 21 7-7" />
    </AdminIcon>
  );
}

export function IconImage() {
  return (
    <AdminIcon>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </AdminIcon>
  );
}

export function IconVideo() {
  return (
    <AdminIcon>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="m17 10 4-2v8l-4-2z" />
    </AdminIcon>
  );
}

type IconActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: 'default' | 'danger' | 'primary' | 'ghost';
  children: ReactNode;
};

export function IconAction({
  label,
  tone = 'default',
  children,
  className = '',
  type = 'button',
  ...props
}: IconActionProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={`admin-icon-btn admin-icon-btn--${tone} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
