import { reportsService } from '../../services/reports/reports.service';

/**
 * Facade for Reports domain.
 * Orchestrates cross-entity data aggregation for reporting.
 */
export const reportsFacade = {
    /**
     * Retrieves the monthly accumulation report for all users.
     * Business Rule: Only administrators can view the global monthly report.
     */
    getMonthlyAccumulation: async (requestingUser: { id: string; role: string }) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized access to global reports.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await reportsService.getMonthlyAccumulation();
    }
};
