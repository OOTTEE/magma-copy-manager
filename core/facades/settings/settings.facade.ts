import { settingsService } from '../../services/settings/settings.service';

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

            await settingsService.updateSetting(key, value);
        }
    }
};
