import { api } from "../../../services/api";

/**
 * AutoBillingLog Interface
 * Represents a single execution of the automated billing process.
 */
export interface AutoBillingLog {
    id: string;
    datetime: string;
    status: 'success' | 'partial' | 'failed';
    jobType: 'billing' | 'sync';
    triggerType: 'auto' | 'manual';
    summary: string;
    details: any; // results array
}

/**
 * AutomationService
 * 
 * Manages communication with the /automation/ backend endpoints.
 */
export const automationService = {
    /**
     * Retrieves the execution history of the automated billing process.
     */
    async getLogs(): Promise<AutoBillingLog[]> {
        const { data, error } = await (api as any).GET("/api/v1/automation/logs", {});
        if (error) throw error;
        // The data is already mapped to our interface by openapi-fetch if schema is updated
        // or typed as 'any' otherwise. We'll cast to be sure.
        return (data as any) as AutoBillingLog[];
    },

    /**
     * Manually triggers the automated billing process now.
     */
    async triggerNow(): Promise<{ status: 'success' | 'partial' | 'failed'; jobId: string }> {
        const { data, error } = await (api as any).POST("/api/v1/automation/trigger", {});
        if (error) throw error;
        return data as any;
    },

    /**
     * Manually triggers the printer synchronization process now.
     */
    async triggerSync(): Promise<{ status: 'success' | 'failed'; jobId: string }> {
        const { data, error } = await (api as any).POST("/api/v1/automation/sync", {});
        if (error) throw error;
        return data as any;
    }
};
