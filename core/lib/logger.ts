import pino from 'pino';
import { serverConfig } from '../config/server.config';

/**
 * Standard Magma Logger (Singleton)
 * 
 * Powered by Pino. It follows the same configuration as Fastify's internal logger
 * to maintain consistency across the entire backend.
 */
export const logger = pino({
    level: serverConfig.logLevel || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    } : undefined,
});

export default logger;
