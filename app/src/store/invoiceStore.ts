import { create } from 'zustand';
import { api } from '../services/api';

interface Invoice {
  id: string;
  userId: string;
  username: string;
  from: string;
  to: string;
  total: number;
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

interface InvoiceState {
  invoices: Invoice[];
  pagination: Pagination;
  filters: Filters;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  fetchInvoices: (force?: boolean) => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: Filters) => void;
  deleteInvoice: (id: string) => Promise<void>;
  reset: () => void;
}

/**
 * InvoiceStore
 * 
 * Manages persisted invoices list with pagination and filtering support.
 */
export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
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

  fetchInvoices: async (force = false) => {
    if (get().isLoading || get().isRefreshing) return;

    const hasData = get().invoices.length > 0;
    
    if (hasData && !force) {
      set({ isRefreshing: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const { filters, pagination } = get();
      
      const { data, error: apiError } = await api.GET("/api/v1/billing/invoices", {
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
        invoices: response.data || [],
        pagination: response.pagination || get().pagination
      });
    } catch (err: any) {
      console.error("[InvoiceStore] Error fetching invoices:", err);
      set({ error: err.message || "Error al cargar el listado de facturas." });
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  setPage: (page: number) => {
    set(state => ({
      pagination: { ...state.pagination, current_page: page }
    }));
    get().fetchInvoices(true);
  },

  setFilters: (filters: Filters) => {
    set(state => ({
      filters,
      pagination: { ...state.pagination, current_page: 1 }
    }));
    get().fetchInvoices(true);
  },

  deleteInvoice: async (id: string) => {
    try {
      const { error: apiError } = await api.DELETE("/api/v1/billing/invoices/{id}", {
        params: { path: { id } }
      });
      if (apiError) throw apiError;
      
      // Refresh list after delete to maintain pagination consistency
      get().fetchInvoices(true);
    } catch (err: any) {
      console.error("[InvoiceStore] Error deleting invoice:", err);
      throw err;
    }
  },

  reset: () => set({ 
    invoices: [], 
    pagination: { total_records: 0, current_page: 1, total_pages: 1, limit: 20 },
    filters: { userIds: [], months: [] },
    isLoading: false, 
    isRefreshing: false, 
    error: null 
  })
}));
