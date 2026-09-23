'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import type { AuthUser } from '@/lib/api-client';

interface AuthStore {
  /** Compatibility flag, never a credential. */
  accessToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setSession: (sessionFlag: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  hasHydrated: false,
  setSession: (_sessionFlag, user) => set({ accessToken: 'cookie-session', user, hasHydrated: true }),
  clearSession: () => {
    set({ accessToken: null, user: null, hasHydrated: true });
    void fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin',
      headers: { 'X-Mig-Csrf': '1' }, keepalive: true }).then(response => {
      if (!response.ok) throw new Error('خروج انجام نشد.');
    }).catch(() => toast.error('ارتباط برای خروج از حساب برقرار نشد. دوباره تلاش کنید.'));
  },
}));

async function restoreSession(): Promise<void> {
  try {
    const response = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' });
    if (response.ok) {
      const body = await response.json() as { user: AuthUser };
      useAuthStore.getState().setSession('cookie-session', body.user);
    }
  } catch {
    toast.error('بررسی نشست انجام نشد. اتصال اینترنت را بررسی کنید.');
  } finally {
    useAuthStore.setState({ hasHydrated: true });
  }
}

if (typeof window !== 'undefined') {
  try { window.localStorage.removeItem('mig-auth'); } catch { /* Storage may be disabled. */ }
  window.addEventListener('mig-session-expired', () => {
    useAuthStore.setState({ accessToken: null, user: null, hasHydrated: true });
    window.location.replace(window.location.pathname.startsWith('/admin') ? '/admin/login' : '/auth');
  });
  void restoreSession();
}
