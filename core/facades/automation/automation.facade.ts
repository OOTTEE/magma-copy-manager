import { autoBillingService } from '../../services/automation/auto-billing.service';
import { autoSyncService } from '../../services/automation/auto-sync.service';
import { db } from '../../db';
import { syncLogs } from '../../db/schema';
import { desc } from 'drizzle-orm';

/**
 * Automation Facade
 * 
 * Orchestrates automation-related tasks and handles RBAC.
 */
export const automationFacade = {
    /**
     * Manually triggers the auto-billing process.
     * Restricted to admin users.
     */
    triggerAutoBilling: async (requestingUser: { id: string; role: string }) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized: Only admins can trigger auto-billing.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await autoBillingService.runJob(requestingUser, 'manual');
    },

    /**
     * Manually triggers the printer synchronization process.
     * Restricted to admin users.
     */
    triggerSync: async (requestingUser: { id: string; role: string }) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized: Only admins can trigger synchronization.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await autoSyncService.runJob(requestingUser, 'manual');
    },

    /**
     * Retrieves the history of auto-billing executions.
     * Restricted to admin users.
     */
    getLogs: async (requestingUser: { id: string; role: string }, limit = 20, offset = 0) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized: Only admins can view automation logs.');
            (error as any).statusCode = 403;
            throw error;
        }

        const logs = await db
            .select()
            .from(syncLogs)
            .orderBy(desc(syncLogs.datetime))
            .limit(limit)
            .offset(offset)
            .all();

        return logs.map((log: any) => ({
            ...log,
            details: log.details ? JSON.parse(log.details) : {}
        }));
    }
};
