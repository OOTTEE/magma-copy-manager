import { create } from 'zustand';
import { api } from '../services/api';

interface SystemState {
    autoSyncError: string | null;
    isLoading: boolean;
    fetchStatus: () => Promise<void>;
    clearError: () => void;
}

/**
 * System Store
 * 
 * Manages global system status, such as automation errors and notifications.
 */
export const useSystemStore = create<SystemState>((set) => ({
    autoSyncError: null,
    isLoading: false,

    fetchStatus: async () => {
        set({ isLoading: true });
        try {
            const { data } = await api.GET("/api/v1/settings/", {});
            if (data) {
                const settings = data as any;
                set({ autoSyncError: settings.auto_sync_last_error || null });
            }
        } catch (error) {
            console.error("Failed to fetch system status:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    clearError: () => set({ autoSyncError: null })
}));
