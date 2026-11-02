import { reportsService } from '../../services/reports/reports.service';

/**
 * Facade for Reports domain.
 * Orchestrates cross-entity data aggregation for reporting and enforces RBAC.
 */
export const reportsFacade = {
    /**
     * Retrieves all available billing periods with KPIs.
     * Business Rule: Only administrators can view period summaries.
     */
    getAvailablePeriods: async (requestingUser: { id: string; role: string }, limit = 12) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized access to report periods.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await reportsService.getAvailablePeriods(limit);
    },

    /**
     * Retrieves the monthly accumulation report for users.
     * Business Rule: Only administrators can view the global monthly report.
     */
    getMonthlyAccumulation: async (
        requestingUser: { id: string; role: string },
        options: {
            period?: string;
            from?: string;
            to?: string;
            includeAllPending?: boolean;
            filter?: 'linked' | 'unlinked' | 'all';
            includeIgnored?: boolean;
        } = {}
    ) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized access to global reports.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await reportsService.getMonthlyAccumulation(options);
    },

    /**
     * Retrieves summary of orphan users with unlinked copies.
     * Business Rule: Only administrators can view unlinked orphans.
     */
    getUnlinkedOrphans: async (requestingUser: { id: string; role: string }, period?: string) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized access to orphan user reports.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await reportsService.getUnlinkedOrphansSummary(period);
    }
};
