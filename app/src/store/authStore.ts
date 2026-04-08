import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useReportStore } from './reportStore';
import { useUserStore } from './userStore';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isVerifyingSession: boolean;
  login: (token: string, refreshToken: string, user: string, role: string) => void;
  updateAccessToken: (token: string, refreshToken: string) => void;
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
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      role: null,
      isAuthenticated: false,
      isVerifyingSession: false,
      login: (token, refreshToken, user, role) => set({ token, refreshToken, user, role, isAuthenticated: true }),
      updateAccessToken: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => {
        // Clear auth state
        set({ token: null, refreshToken: null, user: null, role: null, isAuthenticated: false });
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
