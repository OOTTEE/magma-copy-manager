import { api } from "../../../services/api";

export interface LogUserError {
    userId?: string;
    username: string;
    printUser?: string;
    error: string;
}

export interface LogUserChanged {
    userId: string;
    username: string;
    printUser?: string;
    delta?: {
        a4Bw: number;
        a4Color: number;
        a3Bw: number;
        a3Color: number;
        total: number;
    };
    salesCreated?: number;
    details?: string;
}

export interface LogDetails {
    durationMs: number;
    trace?: string;
    errors: LogUserError[];
    changed: LogUserChanged[];
    unchangedCount: number;
    raw?: any;
}

export interface AutomationLog {
    id: string;
    datetime: string;
    status: 'success' | 'partial' | 'failed';
    triggerType: 'auto' | 'manual';
    processType: 'sync' | 'billing';
    summary: string;
    stats: {
        errorsCount: number;
        changedCount: number;
        unchangedCount: number;
    };
    details: LogDetails;
}

export interface AutomationPeriod {
    period: string;
    name: string;
    from: string;
    to: string;
    isCurrent: boolean;
    status: string;
}

export interface GetLogsParams {
    period?: string;
    status?: 'all' | 'success' | 'partial' | 'failed';
    processType?: 'all' | 'sync' | 'billing';
    limit?: number;
    offset?: number;
}

export interface LogsResponse {
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
    items: AutomationLog[];
}

export const automationService = {
    /**
     * Retrieves execution logs with query filtering.
     */
    async getLogs(params: GetLogsParams = {}): Promise<LogsResponse> {
        const queryParams: Record<string, string | number> = {};
        if (params.period) queryParams.period = params.period;
        if (params.status && params.status !== 'all') queryParams.status = params.status;
        if (params.processType && params.processType !== 'all') queryParams.processType = params.processType;
        if (params.limit) queryParams.limit = params.limit;
        if (params.offset) queryParams.offset = params.offset;

        const { data, error } = await (api as any).GET("/api/v1/automation/logs", {
            params: { query: queryParams }
        });
        if (error) throw error;
        return data as LogsResponse;
    },

    /**
     * Retrieves available periods for filtering logs.
     */
    async getPeriods(): Promise<AutomationPeriod[]> {
        const { data, error } = await (api as any).GET("/api/v1/automation/periods", {});
        if (error) throw error;
        return (data as AutomationPeriod[]) || [];
    },

    /**
     * Manually triggers printer synchronization.
     */
    async triggerSync(): Promise<{ logId: string; status: string; summary?: string }> {
        const { data, error } = await (api as any).POST("/api/v1/automation/sync", {});
        if (error) throw error;
        return data as any;
    },

    /**
     * Manually triggers auto-billing.
     */
    async triggerBilling(): Promise<{ logId: string; status: string; results?: any[] }> {
        const { data, error } = await (api as any).POST("/api/v1/automation/trigger", {});
        if (error) throw error;
        return data as any;
    }
};
