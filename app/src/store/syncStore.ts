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

interface SyncState {
  records: SyncRecord[];
  pagination: Pagination;
  filters: Filters;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  fetchRecords: (force?: boolean) => Promise<void>;
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
