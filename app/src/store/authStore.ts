import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: string, role: string) => void;
  logout: () => void;
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
      login: (token, user, role) => set({ token, user, role, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, role: null, isAuthenticated: false }),
    }),
    {
      name: 'magma-auth-storage', // unique name for the storage
    }
  )
);
