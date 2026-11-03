import { create } from 'zustand';
import { 
    automationService, 
    type AutomationLog, 
    type AutomationPeriod,
    type GetLogsParams 
} from '../features/automation/services/automation.service';

interface AutomationFilters {
    period: string;
    status: 'all' | 'success' | 'partial' | 'failed';
    processType: 'all' | 'sync' | 'billing';
}

interface AutomationState {
    logs: AutomationLog[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
    periods: AutomationPeriod[];
    selectedLogId: string | null;
    filters: AutomationFilters;
    isLoading: boolean;
    isLoadingPeriods: boolean;
    isTriggering: boolean;
    triggeringType: 'sync' | 'billing' | null;
    error: string | null;

    // Actions
    fetchPeriods: () => Promise<void>;
    fetchLogs: (paramsOverride?: Partial<GetLogsParams>) => Promise<void>;
    setFilter: <K extends keyof AutomationFilters>(key: K, value: AutomationFilters[K]) => void;
    selectLog: (id: string | null) => void;
    triggerSync: () => Promise<void>;
    triggerBilling: () => Promise<void>;
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
    logs: [],
    pagination: {
        total: 0,
        limit: 25,
        offset: 0
    },
    periods: [],
    selectedLogId: null,
    filters: {
        period: '',
        status: 'all',
        processType: 'all'
    },
    isLoading: false,
    isLoadingPeriods: false,
    isTriggering: false,
    triggeringType: null,
    error: null,

    fetchPeriods: async () => {
        set({ isLoadingPeriods: true });
        try {
            const periods = await automationService.getPeriods();
            set({ periods });
            // Set current period as default filter if not set
            const current = periods.find(p => p.isCurrent) || periods[0];
            if (current && !get().filters.period) {
                set(state => ({
                    filters: { ...state.filters, period: current.period }
                }));
            }
        } catch (err: any) {
            console.error('Failed to load automation periods:', err);
        } finally {
            set({ isLoadingPeriods: false });
        }
    },

    fetchLogs: async (paramsOverride = {}) => {
        set({ isLoading: true, error: null });
        try {
            const { filters, pagination } = get();
            const response = await automationService.getLogs({
                period: paramsOverride.period !== undefined ? paramsOverride.period : (filters.period || undefined),
                status: paramsOverride.status || filters.status,
                processType: paramsOverride.processType || filters.processType,
                limit: paramsOverride.limit || pagination.limit,
                offset: paramsOverride.offset !== undefined ? paramsOverride.offset : pagination.offset
            });

            const items = response.items || [];
            const selectedLogId = get().selectedLogId;
            // If currently selected log is not in items, select the first one
            const newSelectedId = items.some(l => l.id === selectedLogId) 
                ? selectedLogId 
                : (items[0]?.id || null);

            set({
                logs: items,
                pagination: response.pagination || { total: items.length, limit: 25, offset: 0 },
                selectedLogId: newSelectedId
            });
        } catch (err: any) {
            set({ error: err.message || 'Error al obtener registros de automatismos.' });
        } finally {
            set({ isLoading: false });
        }
    },

    setFilter: (key, value) => {
        set(state => ({
            filters: { ...state.filters, [key]: value },
            pagination: { ...state.pagination, offset: 0 }
        }));
        get().fetchLogs();
    },

    selectLog: (id) => {
        set({ selectedLogId: id });
    },

    triggerSync: async () => {
        set({ isTriggering: true, triggeringType: 'sync', error: null });
        try {
            await automationService.triggerSync();
            await get().fetchLogs({ offset: 0 });
        } catch (err: any) {
            set({ error: err?.response?.data?.message || err.message || 'Error al ejecutar sincronización.' });
        } finally {
            set({ isTriggering: false, triggeringType: null });
        }
    },

    triggerBilling: async () => {
        set({ isTriggering: true, triggeringType: 'billing', error: null });
        try {
            await automationService.triggerBilling();
            await get().fetchLogs({ offset: 0 });
        } catch (err: any) {
            set({ error: err?.response?.data?.message || err.message || 'Error al ejecutar facturación.' });
        } finally {
            set({ isTriggering: false, triggeringType: null });
        }
    }
}));
