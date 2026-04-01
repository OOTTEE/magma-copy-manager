import { create } from 'zustand';
import { api } from '../services/api';

interface ReportState {
  monthlyReport: { period: any, data: any[] } | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMonthlyReport: (force?: boolean) => Promise<void>;
}

/**
 * ReportStore
 * 
 * Manages monthly report data.
 * Includes deduplication logic to avoid redundant fetches.
 */
export const useReportStore = create<ReportState>((set, get) => ({
  monthlyReport: null,
  isLoading: false,
  error: null,

  fetchMonthlyReport: async (force = false) => {
    // Only fetch if forced or if we don't have the report
    if (!force && get().monthlyReport !== null) return;
    if (get().isLoading) return; // Deduplication logic for concurrent calls

    set({ isLoading: true, error: null });
    try {
      const { data, error: apiError } = await api.GET("/api/v1/reports/monthly", {});
      if (apiError) throw apiError;
      
      // Sort by total descending as business rule
      const sortedData = (data?.data || []).sort((a: any, b: any) => b.total - a.total);
      
      set({ 
        monthlyReport: { ...data, data: sortedData } as any 
      });
    } catch (err: any) {
      set({ error: err.message || "Error al cargar el reporte mensual." });
    } finally {
      set({ isLoading: false });
    }
  }
}));
