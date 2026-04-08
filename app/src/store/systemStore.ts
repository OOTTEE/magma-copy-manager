import { create } from 'zustand';
import { api } from '../services/api';

interface DashboardStat {
    month: string;
    total: number;
}

interface ActivityEvent {
    id: string;
    datetime: string;
    type: 'sync' | 'billing';
    status: 'success' | 'failed' | 'partial';
    message: string;
}

interface SystemNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    read: number;
    createdAt: string;
}

interface SystemState {
    autoSyncError: string | null;
    isLoading: boolean;
    isSyncing: boolean;
    isBilling: boolean;
    stats: DashboardStat[];
    activity: ActivityEvent[];
    notifications: SystemNotification[];
    fetchStatus: () => Promise<void>;
    fetchDashboardData: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
    markNotificationAsRead: (id: string) => Promise<void>;
    triggerManualSync: () => Promise<void>;
    triggerManualBilling: () => Promise<void>;
    clearError: () => void;
}

/**
 * System Store
 * 
 * Manages global system status, dashboard analytics, and manual operations.
 */
export const useSystemStore = create<SystemState>((set, get) => ({
    autoSyncError: null,
    isLoading: false,
    isSyncing: false,
    isBilling: false,
    stats: [],
    activity: [],
    notifications: [],

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

    fetchDashboardData: async () => {
        set({ isLoading: true });
        try {
            const [statsRes, activityRes, notificationRes] = await Promise.all([
                api.GET("/api/v1/dashboard/stats", {}),
                api.GET("/api/v1/dashboard/activity", {}),
                api.GET("/api/v1/dashboard/notifications", {})
            ]);

            set({ 
                stats: (statsRes.data as unknown as DashboardStat[]) || [], 
                activity: (activityRes.data as unknown as ActivityEvent[]) || [],
                notifications: (notificationRes.data as unknown as SystemNotification[]) || []
            });
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchNotifications: async () => {
        try {
            const { data } = await api.GET("/api/v1/dashboard/notifications", {});
            set({ notifications: (data as unknown as SystemNotification[]) || [] });
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    },

    markNotificationAsRead: async (id: string) => {
        try {
            await api.PATCH("/api/v1/dashboard/notifications/{id}/read", {
                params: { path: { id } }
            });
            // Update local state by removing the notification (since we only show pending ones)
            set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
            }));
            // Also refresh activity log in case the notification was about a job completion
            await get().fetchDashboardData();
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    },

    triggerManualSync: async () => {
        set({ isSyncing: true });
        try {
            await api.POST("/api/v1/dashboard/sync", {});
            await get().fetchDashboardData();
        } catch (error) {
            console.error("Manual sync failed:", error);
        } finally {
            set({ isSyncing: false });
        }
    },

    triggerManualBilling: async () => {
        set({ isBilling: true });
        try {
            // El backend ahora devuelve 202 inmediatamente
            await api.POST("/api/v1/dashboard/billing", {});
            // No refrescamos todo inmediatamente porque el job está en curso,
            // pero refrescamos para ver si hay logs previos
            await get().fetchDashboardData();
        } catch (error) {
            console.error("Manual billing trigger failed:", error);
        } finally {
            set({ isBilling: false });
        }
    },

    clearError: () => set({ autoSyncError: null })
}));
