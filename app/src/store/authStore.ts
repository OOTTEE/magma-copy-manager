import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useReportStore } from './reportStore';
import { useUserStore } from './userStore';

interface ImpersonationBackup {
  token: string;
  refreshToken: string;
  user: string;
  role: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isVerifyingSession: boolean;
  impersonatingFrom: ImpersonationBackup | null;
  login: (token: string, refreshToken: string, user: string, role: string) => void;
  updateAccessToken: (token: string, refreshToken: string) => void;
  startImpersonation: (token: string, refreshToken: string, user: string, role: string) => void;
  stopImpersonation: () => void;
  logout: () => void;
  setVerifyingSession: (isVerifying: boolean) => void;
}

/**
 * AuthStore
 * 
 * Manages the authentication state of the application.
 * Persists the token to sessionStorage to maintain session across tab reloads but not browser closes.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      role: null,
      isAuthenticated: false,
      isVerifyingSession: false,
      impersonatingFrom: null,
      login: (token, refreshToken, user, role) => set({ token, refreshToken, user, role, isAuthenticated: true }),
      updateAccessToken: (token, refreshToken) => set({ token, refreshToken }),
      startImpersonation: (token, refreshToken, user, role) => {
        const state = get();
        if (!state.token) return;
        set({
          impersonatingFrom: state.impersonatingFrom || {
            token: state.token,
            refreshToken: state.refreshToken || '',
            user: state.user || '',
            role: state.role || 'admin',
          },
          token,
          refreshToken,
          user,
          role,
          isAuthenticated: true,
        });
        useReportStore.getState().reset();
      },
      stopImpersonation: () => {
        const { impersonatingFrom } = get();
        if (!impersonatingFrom) return;
        set({
          token: impersonatingFrom.token,
          refreshToken: impersonatingFrom.refreshToken,
          user: impersonatingFrom.user,
          role: impersonatingFrom.role,
          impersonatingFrom: null,
          isAuthenticated: true,
        });
        useReportStore.getState().reset();
      },
      logout: () => {
        // Clear auth state
        set({ token: null, refreshToken: null, user: null, role: null, isAuthenticated: false, impersonatingFrom: null });
        // Clear other business stores atomically
        useReportStore.getState().reset();
        useUserStore.getState().reset();
      },
      setVerifyingSession: (isVerifying) => set({ isVerifyingSession: isVerifying }),
    }),
    {
      name: 'magma-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
