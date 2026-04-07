import { create } from 'zustand';
import { api } from '../services/api';

interface NexudusCoworker {
  id?: number;
  fullName?: string;
  email?: string;
}

interface UserState {
  users: any[];
  coworkers: NexudusCoworker[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingCoworkers: boolean;
  error: string | null;
  
  // Actions
  fetchUsers: (force?: boolean) => Promise<void>;
  fetchCoworkers: () => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  reset: () => void;
}

/**
 * UserStore
 * 
 * Manages user data and operations.
 * Implements Stale-While-Revalidate (SWR) strategy for background updates.
 */
export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  coworkers: [],
  isLoading: false,
  isRefreshing: false,
  isLoadingCoworkers: false,
  error: null,

  fetchUsers: async (force = false) => {
    // Concurrent fetch protection
    if (get().isLoading || get().isRefreshing) return;

    const hasData = get().users.length > 0;
    
    // SWR Logic: If we have data AND we are not forcing, we refresh silently.
    if (hasData && !force) {
      set({ isRefreshing: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const { data, error: apiError } = await api.GET("/api/v1/users/");
      if (apiError) throw apiError;
      set({ users: data || [] });
    } catch (err: any) {
      console.error("[UserStore] Error fetching users:", err);
      set({ error: err.message || "Error al cargar la lista de usuarios." });
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  fetchCoworkers: async () => {
    if (get().isLoadingCoworkers) return;
    
    set({ isLoadingCoworkers: true });
    try {
      const { data, error: apiError } = await api.GET("/api/v1/nexudus/coworkers");
      if (apiError) throw apiError;
      set({ coworkers: data || [] });
    } catch (err: any) {
      console.error("[UserStore] Error fetching coworkers:", err);
    } finally {
      set({ isLoadingCoworkers: false });
    }
  },

  updateUser: async (id, updatedData) => {
    try {
      const { error: apiError } = await api.PATCH("/api/v1/users/{id}", {
        params: { path: { id } },
        body: updatedData
      });
      if (apiError) throw apiError;

      // Update local state without full refresh
      const currentUsers = get().users;
      set({
        users: currentUsers.map(u => (u.id === id ? { ...u, ...updatedData } : u))
      });
    } catch (err: any) {
      console.error("Error updating user:", err);
      throw err;
    }
  },

  deleteUser: async (id) => {
    try {
      const { error: apiError } = await api.DELETE("/api/v1/users/{id}", {
        params: { path: { id } }
      });
      if (apiError) throw apiError;

      // Update local state
      set({
        users: get().users.filter(u => u.id !== id)
      });
    } catch (err: any) {
      console.error("Error deleting user:", err);
      throw err;
    }
  },

  reset: () => set({ users: [], isLoading: false, isRefreshing: false, error: null })
}));
