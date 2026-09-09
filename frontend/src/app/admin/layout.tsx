import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './admin-ops.css';

export const metadata: Metadata = {
  title: 'پنل مدیریت — گروه صنعتی محمدی',
  description: 'مدیریت عملیات گروه صنعتی محمدی',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mig-ops" data-theme="ops">
      {children}
    </div>
  );
}
