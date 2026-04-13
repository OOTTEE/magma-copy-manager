import * as cron from 'node-cron';
import { copiesFacade } from '../../facades/copies/copies.facade';
import { billingFacade } from '../../facades/billing/billing.facade';
import { settingsService } from '../settings/settings.service';
import { db } from '../../db';
import { syncLogs, users } from '../../db/schema';
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';
import { emailService } from '../notifications/email.service';
import { serverConfig } from '../../config/server.config';

/**
 * AutoBilling Service
 * 
 * Orchestrates the automated monthly billing process.
 * Handles cron scheduling, retries, and sequential task execution.
 */
export class AutoBillingService {
    private scheduledTask: cron.ScheduledTask | null = null;
    private isRunning = false;

    /**
     * Initializes the scheduler based on system settings.
     */
    async init() {
        const enabled = (await settingsService.getSetting('auto_billing_enabled')) === 'true';
        const day = parseInt(await settingsService.getSetting('auto_billing_day'), 10) || 1;
        const time = (await settingsService.getSetting('auto_billing_time')) || '04:00';

        if (this.scheduledTask) {
            this.scheduledTask.stop();
        }

        if (enabled) {
            const [hour, minute] = time.split(':').map(s => parseInt(s, 10));
            // Cron format: minute hour dayOfMonth month year
            const cronExpr = `${minute || 0} ${hour || 4} ${day} * *`;
            
            logger.info(`AutoBilling: Scheduling job: ${cronExpr}`);
            this.scheduledTask = cron.schedule(cronExpr, () => {
                this.runJob({ id: 'system', role: 'admin' }).catch(err => {
                    logger.error(err, 'AutoBilling: Cron Job Failed');
                });
            }, {
                timezone: serverConfig.timezone
            });
        } else {
            logger.info('AutoBilling: Scheduler disabled in settings.');
        }
    }

    /**
     * Executes the complete billing process.
     * Can be triggered by cron or manually.
     */
    async runJob(requestingUser: { id: string; role: string }, triggerType: 'auto' | 'manual' = 'auto') {
        if (this.isRunning) {
            throw new Error('Auto-billing process is already running.');
        }

        this.isRunning = true;
        const logId = randomUUID();
        const startTime = new Date().toISOString();
        const results: any[] = [];
        let status: 'success' | 'failed' | 'partial' = 'success';

        logger.info({ logId, startTime }, 'AutoBilling: Starting job');

        try {
            // Phase 1: Sync printer copies with 3 retries
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    logger.info({ attempt }, 'AutoBilling: Syncing printer copies...');
                    await copiesFacade.syncPrinterCopies(requestingUser);
                    break; 
                } catch (err: any) {
                    logger.warn({ attempt, error: err.message }, 'AutoBilling: Print sync attempt failed');
                    if (attempt === 3) throw new Error(`Print sync failed after 3 attempts: ${err.message}`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }

            // Phase 2: Local Processing
            const allUsers = await db.select().from(users).all();
            const customers = allUsers.filter((u: any) => u.role === 'customer');

            for (const user of customers) {
                const userResult = { 
                    userId: user.id, 
                    username: user.username, 
                    billing: 'pending', 
                    nexudus: 'n/a', 
                    error: null as string | null 
                };

                try {
                    // Magma Nexudus First: Sincronizar directamente consumos
                    try {
                        await billingFacade.syncUserConsumption(requestingUser, user.id);
                        userResult.billing = 'success';
                    } catch (err: any) {
                        if (err.message.includes('No consumption') || err.message.includes('0 copies')) {
                            userResult.billing = 'skipped (no activity)';
                        } else if (err.message.includes('already synced')) {
                            userResult.billing = 'skipped (already synced)';
                        } else {
                            throw err;
                        }
                    }
                } catch (err: any) {
                    logger.error({ username: user.username, error: err.message }, 'AutoBilling: Error syncing consumption');
                    userResult.billing = 'failed';
                    userResult.error = err.message;
                    status = 'partial';
                }

                results.push(userResult);
            }

            // Phase 3: Nexudus Synchronization (Batch)
            logger.info('AutoBilling: Starting Nexudus synchronization...');
            try {
                const syncResult = await billingFacade.syncWithNexudus(requestingUser);
                
                for (const syncItem of syncResult.results) {
                    const existing = results.find(r => r.userId === syncItem.userId);
                    if (existing) {
                        existing.nexudus = syncItem.salesCreated > 0 
                            ? `success (${syncItem.salesCreated} sales)` 
                            : syncItem.skipped > 0 
                                ? 'skipped (already synced)' 
                                : 'n/a (no data)';
                        
                        if (syncItem.errors > 0) {
                            existing.nexudus = `failed (${syncItem.errors} errors)`;
                            status = 'partial';
                        }
                    }
                }
            } catch (err: any) {
                logger.error(err, 'AutoBilling: Nexudus Batch Sync Failed');
                status = 'partial';
                results.push({ nexudusBatchError: err.message });
            }

        } catch (jobError: any) {
            logger.error(jobError, 'AutoBilling: Fatal Job Error');
            status = 'failed';
            results.push({ fatalError: jobError.message });
        } finally {
            // Save Log
            const summary = status === 'success' 
                ? `Procesados ${results.length} usuarios con éxito.` 
                : status === 'partial' 
                    ? `Procesados con errores en algunos usuarios (${results.filter(r => r.error).length} fallos).`
                    : `Error fatal en el proceso: ${results[0]?.fatalError || 'Desconocido'}`;

            await db.insert(syncLogs).values({
                id: logId,
                datetime: startTime,
                status,
                triggerType,
                summary,
                details: JSON.stringify(results)
            }).run();

            // Notify by email
            await emailService.sendNotification({
                subject: `Resumen de Facturación Mensual: ${status.toUpperCase()}`,
                title: status === 'success' ? '✅ Proceso de Facturación Completado' : '⚠️ Resumen de Facturación con Incidencias',
                message: summary,
                type: status === 'success' ? 'success' : 'warning',
                details: JSON.stringify(results, null, 2)
            });

            this.isRunning = false;
            logger.info({ logId, status }, 'AutoBilling: Job finished');
        }

        return { logId, status, results };
    }
}

export const autoBillingService = new AutoBillingService();
