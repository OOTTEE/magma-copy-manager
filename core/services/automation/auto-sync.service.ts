import * as cron from 'node-cron';
import { copiesFacade } from '../../facades/copies/copies.facade';
import { settingsService } from '../settings/settings.service';
import { db } from '../../db';
import { syncLogs } from '../../db/schema';
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';

/**
 * AutoSync Service
 * 
 * Orchestrates the automated printer copy synchronization.
 * Handles recurring schedules (daily/weekly) and error notifications.
 */
export class AutoSyncService {
    private scheduledTask: cron.ScheduledTask | null = null;
    private isRunning = false;

    /**
     * Initializes the scheduler based on system settings.
     */
    async init() {
        const enabled = (await settingsService.getSetting('auto_sync_enabled')) === 'true';
        const frequency = (await settingsService.getSetting('auto_sync_frequency')) || 'daily';
        const dayOfWeek = parseInt(await settingsService.getSetting('auto_sync_day'), 10) || 1;
        const time = (await settingsService.getSetting('auto_sync_time')) || '02:00';

        if (this.scheduledTask) {
            this.scheduledTask.stop();
        }

        if (enabled) {
            const [hour, minute] = time.split(':').map(s => parseInt(s, 10));
            
            let cronExpr = '';
            if (frequency === 'daily') {
                // minute hour * * *
                cronExpr = `${minute || 0} ${hour || 2} * * *`;
            } else {
                // minute hour * * dayOfWeek
                // node-cron 0-6 where 0 is Sunday. Our UI uses 1-7 (Mon-Sun).
                // Mapping: 1->1, 2->2, ..., 6->6, 7->0
                const cronDay = dayOfWeek === 7 ? 0 : dayOfWeek;
                cronExpr = `${minute || 0} ${hour || 2} * * ${cronDay}`;
            }
            
            logger.info(`AutoSync: Scheduling job (${frequency}): ${cronExpr}`);
            this.scheduledTask = cron.schedule(cronExpr, () => {
                this.runJob({ id: 'system', role: 'admin' }).catch(err => {
                    logger.error(err, 'AutoSync: Cron Job Failed');
                });
            });
        } else {
            logger.info('AutoSync: Scheduler disabled.');
        }
    }

    /**
     * Executes the printer synchronization process.
     */
    async runJob(requestingUser: { id: string; role: string }, triggerType: 'auto' | 'manual' = 'auto') {
        if (this.isRunning) {
            if (triggerType === 'manual') throw new Error('Sync process is already running.');
            return;
        }

        this.isRunning = true;
        const logId = randomUUID();
        const startTime = new Date().toISOString();
        let status: 'success' | 'failed' = 'success';
        let summary = '';
        let errorDetails = '';

        logger.info({ logId, startTime }, 'AutoSync: Starting job');

        try {
            // Phase 1: Sync printer copies with 3 retries
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    logger.info({ attempt }, 'AutoSync: Syncing printer...');
                    const result = await copiesFacade.syncPrinterCopies(requestingUser);
                    summary = `Sincronización completada. ${result.syncedCount || 0} usuarios actualizados.`;
                    break; 
                } catch (err: any) {
                    logger.warn({ attempt, error: err.message }, 'AutoSync: Attempt failed');
                    if (attempt === 3) throw err;
                    await new Promise(resolve => setTimeout(resolve, 30000));
                }
            }

            // If we are here, success! Clear last error
            await settingsService.updateSetting('auto_sync_last_error', '');

        } catch (err: any) {
            logger.error(err, 'AutoSync: Job Error');
            status = 'failed';
            summary = `Error en sincronización: ${err.message}`;
            errorDetails = err.message;

            // Persist last error for proactive notification
            await settingsService.updateSetting('auto_sync_last_error', err.message);
        } finally {
            // Save Log
            await db.insert(syncLogs).values({
                id: logId,
                datetime: startTime,
                status,
                triggerType,
                summary,
                details: JSON.stringify({ error: errorDetails })
            }).run();

            this.isRunning = false;
            logger.info({ logId, status }, 'AutoSync: Job finished');
        }

        return { logId, status, summary };
    }
}

export const autoSyncService = new AutoSyncService();
