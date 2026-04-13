import { settingsService } from '../../services/settings/settings.service';
import { autoBillingService } from '../../services/automation/auto-billing.service';
import { autoSyncService } from '../../services/automation/auto-sync.service';
import { emailService } from '../../services/notifications/email.service';

import { logger } from '../../lib/logger';

/**
 * Facade for Settings domain.
 * Handles system-wide configuration orchestration and business rule validation.
 */
export const settingsFacade = {
    /**
     * Retrieves all system settings.
     * Business Rule: Only admins can access system settings.
     */
    getAllSettings: async (requestingUser: { id: string; role: string }) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized access to system settings.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await settingsService.getAllSettings();
    },

    /**
     * Updates multiple system settings with business validation.
     */
    updateSettings: async (
        requestingUser: { id: string; role: string },
        updates: Record<string, string>
    ) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized update of system settings.');
            (error as any).statusCode = 403;
            throw error;
        }

        for (const [key, value] of Object.entries(updates)) {
            // Business Validation: Printer URL
            if (key === 'printer_url') {
                if (!value.startsWith('http://') && !value.startsWith('https://')) {
                    const error = new Error('Printer URL must start with http:// or https://');
                    (error as any).statusCode = 400;
                    throw error;
                }
            }

            // Business Validation: Billing Cycle Day
            if (key === 'billing_cycle_day') {
                const day = parseInt(value, 10);
                if (isNaN(day) || day < 1 || day > 28) {
                    const error = new Error('Billing cycle day must be between 1 and 28');
                    (error as any).statusCode = 400;
                    throw error;
                }
            }

            await settingsService.updateSetting(key, value.toString());
        }

        // Business Rule: Re-initialize automation schedulers if relevant settings changed
        const billingKeys = ['auto_billing_enabled', 'auto_billing_day', 'auto_billing_time'];
        if (Object.keys(updates).some(k => billingKeys.includes(k))) {
            logger.info('AutoBilling: Settings changed, re-initializing scheduler...');
            await autoBillingService.init();
        }

        const syncKeys = ['auto_sync_enabled', 'auto_sync_frequency', 'auto_sync_day', 'auto_sync_time'];
        if (Object.keys(updates).some(k => syncKeys.includes(k))) {
            logger.info('AutoSync: Settings changed, re-initializing scheduler...');
            await autoSyncService.init();
        }
    },

    /**
     * Tests the current SMTP configuration by sending a test email.
     */
    testEmailConnection: async (requestingUser: { id: string; role: string }) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized.');
            (error as any).statusCode = 403;
            throw error;
        }

        await emailService.testConnection();
    }
};
