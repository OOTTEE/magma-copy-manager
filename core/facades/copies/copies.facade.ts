import { copiesService } from '../../services/copies/copies.service';
import { usersService } from '../../services/users/users.service';
import { printerScraperService } from '../../services/printer/printer.scraper.service';
import { reportScrapperService } from '../../services/report/report.scrapper.service';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { logger } from '../../lib/logger';
import { serverConfig } from '../../config/server.config';

/**
 * Facade for Copies domain.
 * Orchestrates business logic and handles resource-level authorization.
 */
export const copiesFacade = {
    /**
     * Retrieves copies for a specific user, validating if the requesting user
     * has permission to see them.
     */
    getUserCopies: async (
        requestingUser: { id: string; role: string },
        targetUserId: string,
        from?: string,
        to?: string
    ) => {
        // Business Rule: A user can only see their own copies unless they are an admin.
        if (requestingUser.role !== 'admin' && requestingUser.id !== targetUserId) {
            const error = new Error('Unauthorized access to resource.');
            (error as any).statusCode = 403; // Forbidden
            throw error;
        }

        return await copiesService.getUserCopies(targetUserId, from, to);
    },


    /**
     * Orchestrates the printer report sync.
     * Download -> Audit -> Parse -> Persist per user.
     */
    syncPrinterCopies: async (requestingUser: { id: string; role: string }) => {
        if (!requestingUser || requestingUser.role !== 'admin') {
            const error = new Error('Only administrators can trigger printer sync.');
            (error as any).statusCode = 403;
            throw error;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const tempPath = await printerScraperService.downloadMonthlyCopies();
        
        // Audit: Move to permanent storage
        const auditDir = path.join(__dirname, serverConfig.reportStorageFolder);
        if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
        const auditPath = path.join(auditDir, `report_${timestamp}.csv`);
        fs.copyFileSync(tempPath, auditPath);

        const reports = await reportScrapperService.parseReport(tempPath);
        const results = {
            status: 'success' as 'success' | 'partial_success' | 'error',
            syncedCount: 0,
            errors: [] as { user: string, message: string }[],
            reportPath: auditPath
        };

        const now = new Date().toISOString();

        for (const report of reports) {
            try {
                let user = await usersService.getByPrintUser(report.userName);
                
                // NEW: Auto-create user if not found
                if (!user) {
                    logger.info({ printUser: report.userName }, 'Copies: User not found during sync. Auto-creating...');
                    user = await usersService.create({
                        username: report.userName,
                        password: 'changeme',
                        role: 'customer',
                        printUser: report.userName,
                        nexudusUser: null
                    });
                }

                if (user) {
                    await copiesService.syncReportRecord(user.id, {
                        a4Color: report.a4Color,
                        a4Bw: report.a4Bw,
                        a3Color: report.a3Color,
                        a3Bw: report.a3Bw
                    }, now);

                    results.syncedCount++;
                }
            } catch (err: any) {
                results.errors.push({ user: report.userName, message: err.message });
            }
        }

        if (results.syncedCount === 0 && reports.length > 0) results.status = 'error';
        else if (results.errors.length > 0) results.status = 'partial_success';

        return results;
    }
};
