import { db } from '../../db';
import { settings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Settings Service
 * 
 * Manages system-wide configuration parameters.
 * Provides fallback values for first-time initialization.
 */
export const settingsService = {
  /**
   * Default values for initial system state.
   */
  DEFAULTS: {
    printer_url: 'https://magma-printer.local',
    billing_cycle_day: '27',
    price_a3_bw_no_paper: '0.05',
    price_a3_color_no_paper: '0.10',
  } as Record<string, string>,

  /**
   * Retrieves a setting value by key.
   * If not found in DB, returns the default value.
   */
  getSetting: async (key: string): Promise<string> => {
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .get();

    return result?.value || settingsService.DEFAULTS[key] || '';
  },

  /**
   * Retrieves all system settings.
   */
  getAllSettings: async () => {
    const dbSettings = await db.select().from(settings);
    
    // Merge DB settings with defaults to ensure all keys exist
    const merged = { ...settingsService.DEFAULTS };
    dbSettings.forEach(s => {
      merged[s.key] = s.value;
    });

    return merged;
  },

  /**
   * Updates or creates a setting.
   */
  updateSetting: async (key: string, value: string) => {
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .get();

    if (existing) {
      await db
        .update(settings)
        .set({ value })
        .where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({
        id: randomUUID(),
        key,
        value,
      });
    }
  }
};
