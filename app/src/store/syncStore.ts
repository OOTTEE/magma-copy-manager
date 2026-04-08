import { create } from 'zustand';
import { api } from '../services/api';

interface SyncRecord {
  id: string;
  userId: string;
  username: string;
  month: string;
  type: string;
  quantity: number;
  nexudusSaleId: string;
  createdOn: string;
}

interface Pagination {
  total_records: number;
  current_page: number;
  total_pages: number;
  limit: number;
}

interface Filters {
  userIds?: string[];
  months?: string[];
}

interface SyncStats {
  totalSalesThisMonth: number;
  usersPendingSync: number;
  period: { from: string; to: string };
}

interface SyncState {
  records: SyncRecord[];
  pagination: Pagination;
  filters: Filters;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  stats: SyncStats | null;
  
  // Actions
  fetchRecords: (force?: boolean) => Promise<void>;
  fetchStats: () => Promise<void>;
  deleteRecord: (id: string, force?: boolean) => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: Filters) => void;
  reset: () => void;
}

/**
 * SyncStore
 * 
 * Manages synchronization history with Nexudus.
 */
export const useSyncStore = create<SyncState>((set, get) => ({
  records: [],
  pagination: {
    total_records: 0,
    current_page: 1,
    total_pages: 1,
    limit: 20
  },
  filters: {
    userIds: [],
    months: []
  },
  isLoading: false,
  isRefreshing: false,
  error: null,
  stats: null,

  fetchStats: async () => {
    try {
      const { data, error: apiError } = await api.GET("/api/v1/billing/stats" as any, {});
      if (apiError) throw apiError;
      set({ stats: data as any });
    } catch (err) {
      console.error("[SyncStore] Error fetching sync stats:", err);
    }
  },

  fetchRecords: async (force = false) => {
    if (get().isLoading || get().isRefreshing) return;

    const hasData = get().records.length > 0;
    
    if (hasData && !force) {
      set({ isRefreshing: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const { filters, pagination } = get();
      
      const { data, error: apiError } = await api.GET("/api/v1/billing/sync" as any, {
        params: {
          query: {
            page: pagination.current_page,
            limit: pagination.limit,
            userIds: filters.userIds?.length ? filters.userIds : undefined,
            months: filters.months?.length ? filters.months : undefined
          } as any
        }
      });

      if (apiError) throw apiError;
      
      const response = data as any;
      set({ 
        records: response.data || [],
        pagination: response.pagination || get().pagination
      });
    } catch (err: any) {
      console.error("[SyncStore] Error fetching sync records:", err);
      set({ error: err.message || "Error al cargar el historial de sincronización." });
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  deleteRecord: async (id: string, force: boolean = false) => {
    set({ isLoading: true, error: null });
    try {
      const { error: apiError } = await api.DELETE("/api/v1/billing/sync/{id}" as any, {
        params: { 
          path: { id },
          query: { force } as any
        }
      });

      if (apiError) throw apiError;
      
      // Refresh data
      await get().fetchRecords(true);
      await get().fetchStats();
    } catch (err: any) {
      console.error("[SyncStore] Error deleting sync record:", err);
      set({ error: err.message || "Error al intentar borrar la venta." });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  setPage: (page: number) => {
    set(state => ({
      pagination: { ...state.pagination, current_page: page }
    }));
    get().fetchRecords(true);
  },

  setFilters: (filters: Filters) => {
    set(state => ({
      filters,
      pagination: { ...state.pagination, current_page: 1 }
    }));
    get().fetchRecords(true);
  },

  reset: () => set({ 
    records: [], 
    pagination: { total_records: 0, current_page: 1, total_pages: 1, limit: 20 },
    filters: { userIds: [], months: [] },
    isLoading: false, 
    isRefreshing: false, 
    error: null 
  })
}));
