import dotenv from 'dotenv';

// Load .env configuration
dotenv.config();

export const serverConfig = {
    logLevel: process.env.LOG_LEVEL || 'info', // INFO, DEBUG, ERROR, WARN, TRACE
    databaseUrl: process.env.DATABASE_URL || (process.env.NODE_ENV === 'test' ? 'data/sqlite.test.db' : 'data/sqlite.db'),
    port: Number(process.env.PORT) || 3000,
    jwtSecret: process.env.JWT_SECRET || 'super-secret-key-1234567890',
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars-long-!!',
    printerUrl: process.env.PRINTER_URL || 'http://192.168.0.200',
    printerAdminPass: process.env.PRINTER_ADMIN_PASS || '12345678',
    browserHeadless: Boolean(process.env.BROWSER_HEADLESS) || true,
    browserSlowMo: Number(process.env.BROWSER_SLOW_MO) || 1000,
    publicFolder: process.env.PUBLIC_FOLDER || 'public',
    reportStorageFolder: process.env.REPORT_STORAGE_FOLDER || 'data/reports',
};
