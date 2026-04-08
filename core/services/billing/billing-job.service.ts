import { billingService } from './billing.service';
import { reportsService } from '../reports/reports.service';
import { db } from '../../db';
import { syncLogs, systemNotifications } from '../../db/schema';
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';

/**
 * Billing Job Service
 * 
 * Orchestrates global billing processes in the background.
 * Ensures atomicity per user and persists state for UI notifications.
 */
export class BillingJobService {
    private isRunning = false;

    /**
     * Executes the global manual billing process.
     */
    async runManualBilling(requestingUser: { id: string; role: string }) {
        if (this.isRunning) {
            throw new Error('Billing job is already running.');
        }

        this.isRunning = true;
        
        // Execute in background
        this.executeJob(requestingUser).catch(err => {
            logger.error(err, 'BillingJob: Fatal Error');
        }).finally(() => {
            this.isRunning = false;
        });

        return { status: 'accepted', message: 'Billing process started in background.' };
    }

    /**
     * Internal orchestration logic.
     */
    private async executeJob(requestingUser: { id: string; role: string }) {
        const startTime = new Date().toISOString();
        const logId = randomUUID();
        logger.info({ logId, startTime }, 'BillingJob: Starting background execution');

        try {
            const report = await reportsService.getMonthlyAccumulation();
            const results: any[] = [];
            let totalSales = 0;
            let failedUsersCount = 0;

            for (const userData of report.data) {
                if (!userData.nexudusUser || userData.total === 0) continue;

                try {
                    logger.debug({ userData: userData }, 'BillingJob: Syncing user consumption');
                    const result = await billingService.syncUserConsumption(userData.id);
                    results.push({ ...result, username: userData.username, status: 'success' });
                    totalSales += result.salesCreated;
                } catch (e: any) {
                    logger.error({ userId: userData.id, error: e.message }, 'BillingJob: User sync failed');
                    results.push({ 
                        userId: userData.id, 
                        username: userData.username, 
                        status: 'failed', 
                        error: e.message 
                    });
                    failedUsersCount++;
                }
            }

            const status = failedUsersCount === 0 ? 'success' : (results.length === failedUsersCount ? 'failed' : 'partial');
            const summary = `Proceso completado. ${totalSales} ventas creadas. ${failedUsersCount} usuarios con error.`;

            // 1. Persist Log
            await db.insert(syncLogs).values({
                id: logId,
                datetime: startTime,
                status,
                triggerType: 'manual',
                summary,
                details: JSON.stringify(results)
            }).run();

            // 2. Create Persistent Notification
            await db.insert(systemNotifications).values({
                id: randomUUID(),
                userId: requestingUser.id,
                type: status === 'success' ? 'success' : (status === 'failed' ? 'error' : 'warning'),
                title: 'Cobro de Copias Finalizado',
                message: summary,
                read: 0,
                createdAt: new Date().toISOString()
            }).run();

            logger.info({ logId, status }, 'BillingJob: Execution finished');

        } catch (globalErr: any) {
            logger.error(globalErr, 'BillingJob: Unexpected global error');
            
            await db.insert(systemNotifications).values({
                id: randomUUID(),
                userId: requestingUser.id,
                type: 'error',
                title: 'Error de Sistema en Cobro',
                message: `El job falló inesperadamente: ${globalErr.message}`,
                read: 0,
                createdAt: new Date().toISOString()
            }).run();
        }
    }

    /**
     * Checks if a job is currently active.
     */
    isJobRunning() {
        return this.isRunning;
    }
}

export const billingJobService = new BillingJobService();
