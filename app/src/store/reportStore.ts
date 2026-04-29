import { create } from 'zustand';
import { api } from '../services/api';

interface ReportFilters {
  from?: string;
  to?: string;
  includeAllPending: boolean;
}

interface ReportState {
  monthlyReport: { period: any, data: any[] } | null;
  filters: ReportFilters;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  fetchMonthlyReport: (force?: boolean) => Promise<void>;
  setFilters: (filters: Partial<ReportFilters>) => void;
  reset: () => void;
}

/**
 * ReportStore
 * 
 * Manages monthly report data.
 * Implements Stale-While-Revalidate (SWR) strategy for background updates.
 */
export const useReportStore = create<ReportState>((set, get) => ({
  monthlyReport: null,
  filters: {
    includeAllPending: false
  },
  isLoading: false,
  isRefreshing: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    // Re-fetch report when filters change
    get().fetchMonthlyReport(true);
  },

  fetchMonthlyReport: async (force = false) => {
    // Concurrent fetch protection
    if (get().isLoading || get().isRefreshing) return;

    const hasData = get().monthlyReport !== null;
    const { filters } = get();
    
    // SWR Logic: If we have data AND we are not forcing, we refresh silently.
    if (hasData && !force) {
      set({ isRefreshing: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const { data, error: apiError } = await api.GET("/api/v1/reports/monthly", {
        params: {
          query: {
            from: filters.from,
            to: filters.to,
            includeAllPending: filters.includeAllPending
          }
        }
      });
      if (apiError) throw apiError;
      
      // Sort by total descending as business rule
      const sortedData = (data?.data || []).sort((a: any, b: any) => b.total - a.total);
      
      set({ 
        monthlyReport: { ...data, data: sortedData } as any 
      });
    } catch (err: any) {
      console.error("[ReportStore] Error fetching report:", err);
      set({ error: err.message || "Error al cargar el reporte mensual." });
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  reset: () => set({ 
    monthlyReport: null, 
    filters: { includeAllPending: false },
    isLoading: false, 
    isRefreshing: false, 
    error: null 
  })
}));
