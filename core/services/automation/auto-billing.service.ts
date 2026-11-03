import * as cron from 'node-cron';
import { copiesFacade } from '../../facades/copies/copies.facade';
import { billingFacade } from '../../facades/billing/billing.facade';
import { settingsService } from '../settings/settings.service';
import { nexudusService } from '../nexudus/nexudus.service';
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
 * Handles cron scheduling, non-blocking hardware sync, atomic per-user execution,
 * and unified audit logging.
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
        const startMs = Date.now();
        const startTime = new Date().toISOString();
        const results: any[] = [];
        let status: 'success' | 'failed' | 'partial' = 'success';
        let fatalErrorStr = '';
        let printerWarning: string | null = null;

        logger.info({ logId, startTime }, 'AutoBilling: Starting job');

        try {
            // Step 1: Pro-active Nexudus Authentication verification
            try {
                await nexudusService.ensureAuthenticated();
            } catch (authErr: any) {
                logger.warn({ error: authErr.message }, 'AutoBilling: Pre-flight Nexudus auth warning');
            }

            // Step 2: Sync printer copies with up to 3 retries (NON-BLOCKING)
            // If physical printer is asleep or offline, we log a warning but DO NOT cancel billing
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    logger.info({ attempt }, 'AutoBilling: Syncing printer copies...');
                    await copiesFacade.syncPrinterCopies(requestingUser);
                    printerWarning = null;
                    break;
                } catch (err: any) {
                    logger.warn({ attempt, error: err.message }, 'AutoBilling: Print sync attempt failed');
                    if (attempt === 3) {
                        printerWarning = `Impresora no respondió tras 3 intentos (${err.message}). Se continuó facturación con lecturas consolidadas.`;
                        logger.warn(printerWarning);
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                }
            }

            // Step 3: Single Consolidated Billing Batch per User
            const allUsers = await db.select().from(users).all();
            const customers = allUsers.filter((u: any) => u.role === 'customer' && !u.isIgnored);

            for (const user of customers) {
                const userResult = {
                    userId: user.id,
                    username: user.username,
                    billing: 'pending',
                    salesCreated: 0,
                    error: null as string | null
                };

                // Isolated per-user execution with 1 individual retry on transient network errors
                for (let tryIdx = 1; tryIdx <= 2; tryIdx++) {
                    try {
                        const syncRes = await billingFacade.syncUserConsumption(requestingUser, user.id);
                        userResult.salesCreated = syncRes?.salesCreated || 0;
                        userResult.billing = userResult.salesCreated > 0 
                            ? `success (${userResult.salesCreated} sales)` 
                            : 'skipped (no new sales)';
                        break;
                    } catch (err: any) {
                        const errMsg = err.message || '';
                        if (errMsg.includes('No consumption') || errMsg.includes('0 copies')) {
                            userResult.billing = 'skipped (no activity)';
                            break;
                        } else if (errMsg.includes('already synced')) {
                            userResult.billing = 'skipped (already synced)';
                            break;
                        } else if (tryIdx === 1) {
                            logger.warn({ username: user.username, error: errMsg }, 'AutoBilling: User sync attempt 1 failed, retrying in 3s...');
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        } else {
                            logger.error({ username: user.username, error: errMsg }, 'AutoBilling: Error syncing consumption for user');
                            userResult.billing = 'failed';
                            userResult.error = errMsg;
                            status = 'partial';
                        }
                    }
                }

                results.push(userResult);
            }

        } catch (jobError: any) {
            logger.error(jobError, 'AutoBilling: Fatal Job Error');
            status = 'failed';
            fatalErrorStr = jobError.stack || jobError.message;
            results.push({ fatalError: jobError.message });
        } finally {
            const durationMs = Date.now() - startMs;

            // Segregate results into errors, changed, unchanged
            const structuredErrors: any[] = [];
            const structuredChanged: any[] = [];
            let unchangedCount = 0;

            if (fatalErrorStr) {
                structuredErrors.push({ username: 'Sistema', error: fatalErrorStr });
            }

            if (printerWarning) {
                structuredErrors.push({ username: 'Servidor Impresión', error: printerWarning });
                if (status === 'success') {
                    status = 'partial';
                }
            }

            for (const r of results) {
                if (r.error || r.billing === 'failed') {
                    structuredErrors.push({
                        userId: r.userId,
                        username: r.username,
                        error: r.error || 'Error al facturar en Nexudus'
                    });
                } else if (r.salesCreated > 0) {
                    structuredChanged.push({
                        userId: r.userId,
                        username: r.username,
                        details: r.billing,
                        salesCreated: r.salesCreated
                    });
                } else if (r.userId) {
                    unchangedCount++;
                }
            }

            const fatalMsg = (results[0]?.fatalError || fatalErrorStr || 'Desconocido').split('\n')[0].trim();
            const summary = status === 'success'
                ? `Procesados ${results.length} usuarios con éxito.`
                : status === 'partial'
                    ? `Procesados con incidencias (${structuredErrors.length} advertencias/fallos).`
                    : `Error fatal en el proceso: ${fatalMsg}`;

            const logDetails = {
                durationMs,
                trace: fatalErrorStr || undefined,
                errors: structuredErrors,
                changed: structuredChanged,
                unchangedCount,
                raw: results
            };

            await db.insert(syncLogs).values({
                id: logId,
                datetime: startTime,
                status,
                triggerType,
                processType: 'billing',
                summary,
                details: JSON.stringify(logDetails)
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
