import { autoBillingService } from '../../services/automation/auto-billing.service';
import { autoSyncService } from '../../services/automation/auto-sync.service';
import { reportsService } from '../../services/reports/reports.service';
import { db } from '../../db';
import { syncLogs } from '../../db/schema';
import { desc, and, gte, lte, eq, sql } from 'drizzle-orm';

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
     * Retrieves available periods for filtering automation logs.
     */
    getPeriods: async (requestingUser: { id: string; role: string }) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized: Only admins can view automation periods.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await reportsService.getAvailablePeriods(12);
    },

    /**
     * Retrieves the history of automation executions with filtering and pagination.
     * Restricted to admin users.
     */
    getLogs: async (
        requestingUser: { id: string; role: string },
        options: {
            period?: string;
            from?: string;
            to?: string;
            status?: string;
            processType?: string;
            limit?: number;
            offset?: number;
        } = {}
    ) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized: Only admins can view automation logs.');
            (error as any).statusCode = 403;
            throw error;
        }

        const {
            period,
            status = 'all',
            processType = 'all',
            limit = 20,
            offset = 0
        } = options;

        let fromStr = options.from;
        let toStr = options.to;

        if (period) {
            const periodDates = await reportsService.getPeriodDates(period);
            fromStr = periodDates.fromStr;
            toStr = periodDates.toStr;
        }

        const conditions: any[] = [];

        if (fromStr) {
            conditions.push(gte(syncLogs.datetime, fromStr));
        }
        if (toStr) {
            conditions.push(lte(syncLogs.datetime, toStr));
        }
        if (status && status !== 'all') {
            conditions.push(eq(syncLogs.status, status));
        }
        if (processType && processType !== 'all') {
            conditions.push(eq(syncLogs.processType, processType));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Count total
        const countRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(syncLogs)
            .where(whereClause)
            .get();
        const total = Number(countRes?.count || 0);

        // Fetch logs
        const logs = await db
            .select()
            .from(syncLogs)
            .where(whereClause)
            .orderBy(desc(syncLogs.datetime))
            .limit(limit)
            .offset(offset)
            .all();

        const items = logs.map((log: any) => {
            let parsedDetails: any = {};
            try {
                parsedDetails = log.details ? JSON.parse(log.details) : {};
            } catch {
                parsedDetails = { raw: log.details };
            }

            // Normalization for backward compatibility
            const errors = parsedDetails.errors || (parsedDetails.error ? [{ username: 'Sistema', error: parsedDetails.error }] : []);
            const changed = parsedDetails.changed || [];
            const unchangedCount = parsedDetails.unchangedCount ?? (Array.isArray(parsedDetails) ? parsedDetails.filter((r: any) => !r.error && (!r.nexudus || !r.nexudus.includes('success'))).length : 0);
            const trace = parsedDetails.trace || parsedDetails.error || (parsedDetails.fatalError ? parsedDetails.fatalError : undefined);
            const durationMs = parsedDetails.durationMs || 0;

            const structuredDetails = {
                durationMs,
                trace,
                errors,
                changed,
                unchangedCount,
                raw: parsedDetails.raw || (Array.isArray(parsedDetails) ? parsedDetails : undefined)
            };

            const inferredProcessType = log.processType || (
                log.summary?.toLowerCase().includes('facturación') || log.summary?.toLowerCase().includes('cobro') || log.summary?.toLowerCase().includes('procesados')
                    ? 'billing'
                    : 'sync'
            );

            return {
                id: log.id,
                datetime: log.datetime,
                status: log.status,
                triggerType: log.triggerType || 'auto',
                processType: inferredProcessType,
                summary: log.summary || '',
                stats: {
                    errorsCount: errors.length,
                    changedCount: changed.length,
                    unchangedCount
                },
                details: structuredDetails
            };
        });

        return {
            pagination: {
                total,
                limit,
                offset
            },
            items
        };
    }
};
