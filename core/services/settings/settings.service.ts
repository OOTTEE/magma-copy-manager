import { db } from '../../db';
import { settings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { serverConfig } from '../../config/server.config';
import { logger } from '../../lib/logger';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(serverConfig.encryptionKey.slice(0, 32)); // Must be 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

const SECRET_KEYS = ['nexudus_token', 'nexudus_password', 'smtp_password'];

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
    nexudus_url: 'https://spaces.nexudus.com',
    nexudus_email: '',
    nexudus_password: '',
    nexudus_token: '',
    nexudus_product_id_a4bw: '',
    nexudus_product_id_a4color: '',
    nexudus_product_id_a3bw: '',
    nexudus_product_id_a3color: '',
    nexudus_product_id_sra3bw: '',
    nexudus_product_id_sra3color: '',
    email_notifications_enabled: 'false',
    email_recipient: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_secure: 'false',
  } as Record<string, string>,

  /**
   * Encrypts a string using AES-256-CBC.
   */
  encrypt: (text: string): string => {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  },

  /**
   * Decrypts a string using AES-256-CBC.
   */
  decrypt: (text: string): string => {
    const textParts = text.split(':');
    const ivToken = textParts.shift();
    if (!ivToken) return '';
    const iv = Buffer.from(ivToken, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  },

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
    dbSettings.forEach((s: any) => {
      // Mask sensitive fields
      if (SECRET_KEYS.includes(s.key) && s.value) {
        merged[s.key] = '********';
      } else {
        merged[s.key] = s.value;
      }
    });

    return merged;
  },

  /**
   * Retrieves a secret setting (decrypted if needed).
   */
  getSecretSetting: async (key: string): Promise<string> => {
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .get();
    
    if (!result?.value) return settingsService.DEFAULTS[key] || '';

    // If it's a secret key and seems encrypted (contains ':')
    if (SECRET_KEYS.includes(key) && result.value.includes(':')) {
      try {
        return settingsService.decrypt(result.value);
      } catch (e) {
        logger.error({ key, error: e }, 'Settings: Failed to decrypt setting');
        return '';
      }
    }
    return result.value;
  },

  /**
   * Updates or creates a setting.
   */
  updateSetting: async (key: string, value: string) => {
    if (SECRET_KEYS.includes(key) && value === '********') {
      logger.debug({ key }, 'Settings: Ignoring masked value update for secret key');
      return;
    }

    let finalValue = value;

    // Encrypt sensitive fields
    if (SECRET_KEYS.includes(key) && value && value !== '********') {
      finalValue = settingsService.encrypt(value);
    }

    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .get();

    if (existing) {
      await db
        .update(settings)
        .set({ value: finalValue })
        .where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({
        id: randomUUID(),
        key,
        value: finalValue,
      });
    }
  }
};
