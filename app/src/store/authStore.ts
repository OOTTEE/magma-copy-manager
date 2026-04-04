import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useReportStore } from './reportStore';
import { useUserStore } from './userStore';

interface AuthState {
  token: string | null;
  user: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isVerifyingSession: boolean;
  login: (token: string, user: string, role: string) => void;
  logout: () => void;
  setVerifyingSession: (isVerifying: boolean) => void;
}

/**
 * AuthStore
 * 
 * Manages the authentication state of the application.
 * Persists the token to localStorage to maintain session across reloads.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
      isVerifyingSession: false,
      login: (token, user, role) => set({ token, user, role, isAuthenticated: true }),
      logout: () => {
        // Clear auth state
        set({ token: null, user: null, role: null, isAuthenticated: false });
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
