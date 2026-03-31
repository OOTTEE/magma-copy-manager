import dotenv from 'dotenv';

// Load .env configuration
dotenv.config();

console.log("load node_env=", process.env.NODE_ENV);

export const serverConfig = {
    logLevel: process.env.LOG_LEVEL || 'info', // INFO, DEBUG, ERROR, WARN, TRACE
    databaseUrl: process.env.DATABASE_URL || (process.env.NODE_ENV === 'test' ? 'sqlite.test.db' : 'sqlite.db'),
    port: Number(process.env.PORT) || 3000,
    jwtSecret: process.env.JWT_SECRET || 'super-secret-key-1234567890',
    printerUrl: process.env.PRINTER_URL || 'http://192.168.0.200',
    printerAdminPass: process.env.PRINTER_ADMIN_PASS || '12345678',
};
