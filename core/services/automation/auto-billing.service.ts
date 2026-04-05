import * as cron from 'node-cron';
import { copiesFacade } from '../../facades/copies/copies.facade';
import { billingFacade } from '../../facades/billing/billing.facade';
import { nexudusFacade } from '../../facades/billing/nexudus.facade';
import { settingsService } from '../settings/settings.service';
import { db } from '../../db';
import { autoBillingLogs, users } from '../../db/schema';
import { randomUUID } from 'crypto';

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
            
            console.log(`[AutoBilling] Scheduling job: ${cronExpr}`);
            this.scheduledTask = cron.schedule(cronExpr, () => {
                this.runJob({ id: 'system', role: 'admin' }).catch(err => {
                    console.error('[AutoBilling] Cron Job Failed:', err);
                });
            });
        } else {
            console.log('[AutoBilling] Scheduler disabled in settings.');
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

        console.log(`[AutoBilling] Starting job ${logId} at ${startTime}`);

        try {
            // Phase 1: Sync printer copies with 3 retries
            let syncResult: any = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`[AutoBilling] Syncing printer copies (Attempt ${attempt}/3)...`);
                    syncResult = await copiesFacade.syncPrinterCopies(requestingUser);
                    break; 
                } catch (err: any) {
                    console.warn(`[AutoBilling] Print sync attempt ${attempt} failed:`, err.message);
                    if (attempt === 3) throw new Error(`Print sync failed after 3 attempts: ${err.message}`);
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }

            // Phase 2: Process each customer
            const allUsers = await db.select().from(users).all();
            const customers = allUsers.filter(u => u.role === 'customer');

            for (const user of customers) {
                const userResult = { 
                    userId: user.id, 
                    username: user.username, 
                    billing: 'pending', 
                    nexudus: 'n/a', 
                    error: null as string | null 
                };

                try {
                    // 1. Local Invoice (Implicitly skips zero-activity users in persist invoice logic)
                    try {
                        await billingFacade.persistInvoice(requestingUser, user.id);
                        userResult.billing = 'success';
                    } catch (err: any) {
                        if (err.message.includes('0 copies')) {
                            userResult.billing = 'skipped (no activity)';
                        } else if (err.message.includes('already exists')) {
                            userResult.billing = 'skipped (already exists)';
                        } else {
                            throw err;
                        }
                    }

                    // 2. Nexudus Upload (only if local billing happened or was already there)
                    if (userResult.billing === 'success' && user.nexudusUser) {
                        try {
                            const businessId = 1; // Default Magma business ID
                            await nexudusFacade.createInvoice(requestingUser, user.id, businessId, {
                                Draft: true // Requirement: Create as Draft
                            });
                            userResult.nexudus = 'success';
                        } catch (err: any) {
                            userResult.nexudus = 'failed';
                            userResult.error = `Nexudus error: ${err.message}`;
                            status = 'partial';
                        }
                    }
                } catch (err: any) {
                    console.error(`[AutoBilling] Error processing user ${user.username}:`, err.message);
                    userResult.billing = 'failed';
                    userResult.error = err.message;
                    status = 'partial';
                }

                results.push(userResult);
            }

        } catch (jobError: any) {
            console.error('[AutoBilling] Fatal Job Error:', jobError.message);
            status = 'failed';
            results.push({ fatalError: jobError.message });
        } finally {
            // Save Log
            const summary = status === 'success' 
                ? `Procesados ${results.length} usuarios con éxito.` 
                : status === 'partial' 
                    ? `Procesados con errores en algunos usuarios (${results.filter(r => r.error).length} fallos).`
                    : `Error fatal en el proceso: ${results[0]?.fatalError || 'Desconocido'}`;

            await db.insert(autoBillingLogs).values({
                id: logId,
                datetime: startTime,
                status,
                jobType: 'billing',
                triggerType,
                summary,
                details: JSON.stringify(results)
            }).run();

            this.isRunning = false;
            console.log(`[AutoBilling] Job ${logId} finished with status: ${status}`);
        }

        return { logId, status, results };
    }
}

export const autoBillingService = new AutoBillingService();
