import { create } from 'zustand';
import { api } from '../services/api';

interface UserState {
  users: any[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchUsers: (force?: boolean) => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

/**
 * UserStore
 * 
 * Manages user data and operations.
 * Includes deduplication logic to avoid redundant fetches.
 */
export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async (force = false) => {
    // Only fetch if forced or if we don't have users
    if (!force && get().users.length > 0) return;
    if (get().isLoading) return; // Deduplication logic for concurrent calls

    set({ isLoading: true, error: null });
    try {
      const { data, error: apiError } = await api.GET("/api/v1/users/");
      if (apiError) throw apiError;
      set({ users: data || [] });
    } catch (err: any) {
      set({ error: err.message || "Error al cargar la lista de usuarios." });
    } finally {
      set({ isLoading: false });
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
  }
}));
