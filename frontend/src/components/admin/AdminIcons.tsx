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

export function IconClear() {
  return (
    <AdminIcon>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
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
