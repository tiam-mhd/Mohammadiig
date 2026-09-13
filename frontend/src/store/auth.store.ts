'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/lib/api-client';

interface AuthStore {
  accessToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setSession: (accessToken, user) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'mig-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);

function markHydrated() {
  useAuthStore.setState({ hasHydrated: true });
}

if (typeof window !== 'undefined') {
  if (useAuthStore.persist.hasHydrated()) {
    markHydrated();
  }
  useAuthStore.persist.onFinishHydration(markHydrated);
}
