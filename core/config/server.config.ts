import dotenv from 'dotenv';

// Load .env configuration
dotenv.config();

export const serverConfig = {
    logLevel: process.env.LOG_LEVEL || 'info', // INFO, DEBUG, ERROR, WARN, TRACE
    databaseUrl: process.env.DATABASE_URL || 'sqlite.db',
    port: Number(process.env.PORT) || 3000,
};
