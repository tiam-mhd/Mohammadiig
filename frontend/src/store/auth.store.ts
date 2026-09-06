'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  companyName: string | null;
}

interface AuthStore {
  accessToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>()(persist((set) => ({
  accessToken: null,
  user: null,
  hasHydrated: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
}), { name: 'mig-auth', onRehydrateStorage: () => () => useAuthStore.setState({ hasHydrated: true }) }));
