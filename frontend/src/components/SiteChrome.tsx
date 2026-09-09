'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

function hideSiteChrome(pathname: string | null) {
  if (!pathname) return false;
  return pathname === '/auth' || pathname.startsWith('/auth/') || pathname === '/admin' || pathname.startsWith('/admin/');
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bare = hideSiteChrome(pathname);

  return (
    <>
      {bare ? null : <Header />}
      <main className="flex-1">{children}</main>
      {bare ? null : <Footer />}
    </>
  );
}
