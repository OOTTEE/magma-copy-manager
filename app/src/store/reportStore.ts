import { create } from 'zustand';
import { api } from '../services/api';

export interface PeriodMetrics {
  totalCopies: number;
  linkedCopies: number;
  pendingCopies: number;
  syncedCopies: number;
  unlinkedUsersCount: number;
  totalUsersCount: number;
}

export interface PeriodSummary {
  period: string; // "YYYY-MM"
  name: string;   // e.g. "Octubre 2026"
  from: string;
  to: string;
  isCurrent: boolean;
  status: 'billed' | 'partial' | 'pending';
  metrics: PeriodMetrics;
}

export interface ReportUserData {
  id: string;
  userId: string;
  username: string;
  printUser: string;
  nexudusUser: string | null;
  role: string;
  isIgnored: boolean;
  hasLinkedAccount: boolean;
  accountsCount: number;
  isOverAllocated?: boolean;
  status: 'billed' | 'partial' | 'pending';
  a4Color: number;
  a4Bw: number;
  a3Color: number;
  a3Bw: number;
  sra3Color: number;
  sra3Bw: number;
  a3NoPaperMode: boolean;
  total: number;
  copies?: {
    total: number;
    linked: number;
    pending: number;
    synced: number;
    byType?: Record<string, { total: number; billed: number }>;
  };
  accounts?: Array<{
    id: string;
    nexudusUserId: string;
    isDefault: boolean;
    createdOn: string;
  }>;
}

export interface OrphanUser {
  id: string;
  username: string;
  printUser: string;
  totalCopies: number;
  a4Color: number;
  a4Bw: number;
  a3Color: number;
  a3Bw: number;
  sra3Color: number;
  sra3Bw: number;
}

interface ReportPeriodInfo {
  month?: string;
  from?: string;
  to?: string;
  allPending?: boolean;
}

interface ReportFilters {
  from?: string;
  to?: string;
  includeAllPending: boolean;
  filter?: 'linked' | 'unlinked' | 'all';
}

interface ReportState {
  // Periods
  periods: PeriodSummary[];
  isLoadingPeriods: boolean;

  // Cache of reports per period key (e.g. "2026-10")
  periodReports: Record<string, { period: ReportPeriodInfo; data: ReportUserData[] }>;
  loadingPeriodReports: Record<string, boolean>;
  expandedPeriods: Record<string, boolean>;

  // Orphans
  orphans: Record<string, OrphanUser[]>;
  isLoadingOrphans: boolean;

  // Legacy / Active single report
  monthlyReport: { period: ReportPeriodInfo; data: ReportUserData[] } | null;
  filters: ReportFilters;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  fetchPeriods: (force?: boolean) => Promise<void>;
  fetchPeriodReport: (period: string, force?: boolean, silent?: boolean) => Promise<void>;
  togglePeriodExpanded: (period: string) => void;
  fetchOrphans: (period?: string) => Promise<OrphanUser[]>;
  toggleUserIgnored: (userId: string, isIgnored: boolean) => Promise<void>;

  // Legacy compatibility
  fetchMonthlyReport: (force?: boolean) => Promise<void>;
  setFilters: (filters: Partial<ReportFilters>) => void;
  reset: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  periods: [],
  isLoadingPeriods: false,
  periodReports: {},
  loadingPeriodReports: {},
  expandedPeriods: {},
  orphans: {},
  isLoadingOrphans: false,

  monthlyReport: null,
  filters: {
    includeAllPending: false,
    filter: 'linked'
  },
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchPeriods: async (force = false) => {
    if (get().isLoadingPeriods && !force) return;
    set({ isLoadingPeriods: true, error: null });

    try {
      const { data, error: apiError } = await api.GET('/api/v1/reports/periods');
      if (apiError) throw apiError;

      const periodsList: PeriodSummary[] = (data as PeriodSummary[]) || [];

      // Auto-expand the current period if no accordion is open yet
      const expanded = { ...get().expandedPeriods };
      const current = periodsList.find(p => p.isCurrent) || periodsList[0];
      if (current && Object.keys(expanded).length === 0) {
        expanded[current.period] = true;
      }

      set({ periods: periodsList, expandedPeriods: expanded });

      // Automatically fetch details for the expanded period(s)
      for (const p of periodsList) {
        if (expanded[p.period] && !get().periodReports[p.period]) {
          get().fetchPeriodReport(p.period);
        }
      }
    } catch (err: unknown) {
      console.error('[ReportStore] Error fetching periods:', err);
      const msg = err instanceof Error ? err.message : 'Error al recuperar los períodos de facturación.';
      set({ error: msg });
    } finally {
      set({ isLoadingPeriods: false });
    }
  },

  fetchPeriodReport: async (period: string, force = false, silent = false) => {
    if (get().loadingPeriodReports[period] && !force) return;

    if (!silent) {
      set(state => ({
        loadingPeriodReports: { ...state.loadingPeriodReports, [period]: true }
      }));
    }

    try {
      const { data, error: apiError } = await api.GET('/api/v1/reports/monthly', {
        params: {
          query: {
            period,
            filter: 'linked',
            includeIgnored: false
          }
        }
      });
      if (apiError) throw apiError;

      const rawData = data?.data || [];
      const periodInfo: ReportPeriodInfo = data?.period || {};

      // Sort users by total copies descending
      const sortedUsers: ReportUserData[] = (rawData as unknown as ReportUserData[])
        .slice()
        .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

      set(state => ({
        periodReports: {
          ...state.periodReports,
          [period]: { period: periodInfo, data: sortedUsers }
        }
      }));
    } catch (err: unknown) {
      console.error(`[ReportStore] Error fetching report for ${period}:`, err);
    } finally {
      if (!silent) {
        set(state => ({
          loadingPeriodReports: { ...state.loadingPeriodReports, [period]: false }
        }));
      }
    }
  },

  togglePeriodExpanded: (period: string) => {
    const isCurrentlyExpanded = Boolean(get().expandedPeriods[period]);
    const nextState = !isCurrentlyExpanded;

    set(state => ({
      expandedPeriods: { ...state.expandedPeriods, [period]: nextState }
    }));

    if (nextState && !get().periodReports[period]) {
      get().fetchPeriodReport(period);
    }
  },

  fetchOrphans: async (period?: string) => {
    const cacheKey = period || 'all';
    set({ isLoadingOrphans: true });
    try {
      const { data, error: apiError } = await api.GET('/api/v1/reports/orphans', {
        params: { query: { period } }
      });
      if (apiError) throw apiError;

      const list: OrphanUser[] = (data as unknown as OrphanUser[]) || [];
      set(state => ({
        orphans: { ...state.orphans, [cacheKey]: list }
      }));
      return list;
    } catch (err: unknown) {
      console.error('[ReportStore] Error fetching orphans:', err);
      return [];
    } finally {
      set({ isLoadingOrphans: false });
    }
  },

  toggleUserIgnored: async (userId: string, isIgnored: boolean) => {
    try {
      const { error: apiError } = await api.PATCH('/api/v1/users/{id}', {
        params: { path: { id: userId } },
        body: { isIgnored: isIgnored ? 1 : 0 }
      });
      if (apiError) throw apiError;

      // Refresh periods and reports to reflect change
      await get().fetchPeriods(true);
      const activePeriods = Object.keys(get().expandedPeriods).filter(k => get().expandedPeriods[k]);
      for (const p of activePeriods) {
        await get().fetchPeriodReport(p, true);
      }
    } catch (err: unknown) {
      console.error(`[ReportStore] Error updating ignore status for user ${userId}:`, err);
      throw err;
    }
  },

  // Legacy compatibility implementations
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().fetchMonthlyReport(true);
  },

  fetchMonthlyReport: async (force = false) => {
    if (get().isLoading || get().isRefreshing) return;

    const hasData = get().monthlyReport !== null;
    const { filters } = get();

    if (hasData && !force) {
      set({ isRefreshing: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const { data, error: apiError } = await api.GET('/api/v1/reports/monthly', {
        params: {
          query: {
            from: filters.from,
            to: filters.to,
            includeAllPending: filters.includeAllPending,
            filter: filters.filter || 'linked',
            includeIgnored: false
          }
        }
      });
      if (apiError) throw apiError;

      const rawData = data?.data || [];
      const periodInfo: ReportPeriodInfo = data?.period || {};
      const sortedData: ReportUserData[] = (rawData as unknown as ReportUserData[])
        .slice()
        .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

      set({
        monthlyReport: { period: periodInfo, data: sortedData }
      });
    } catch (err: unknown) {
      console.error('[ReportStore] Error fetching monthly report:', err);
      const msg = err instanceof Error ? err.message : 'Error al cargar el reporte mensual.';
      set({ error: msg });
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  reset: () => set({
    periods: [],
    periodReports: {},
    loadingPeriodReports: {},
    expandedPeriods: {},
    orphans: {},
    monthlyReport: null,
    filters: { includeAllPending: false, filter: 'linked' },
    isLoading: false,
    isRefreshing: false,
    error: null
  })
}));
