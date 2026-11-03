import pino from 'pino';
import { join } from 'path';
import { serverConfig } from '../config/server.config';

/**
 * Creates Pino configuration with transports based on the environment.
 * In development and production, streams to stdout while simultaneously rolling logs to disk.
 * In test environment, uses standard in-memory output to prevent file I/O contention.
 */
function getPinoOptions(): pino.LoggerOptions {
    const level = (serverConfig.logLevel || 'info').toLowerCase();

    if (process.env.NODE_ENV === 'test') {
        return { level };
    }

    const targets: any[] = [];

    // Target 1: Console / stdout for Docker & terminal visibility
    if (process.env.NODE_ENV !== 'production') {
        targets.push({
            target: 'pino-pretty',
            options: {
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
            level
        });
    } else {
        targets.push({
            target: 'pino/file',
            options: { destination: 1 }, // stdout
            level
        });
    }

    // Target 2: Persistent rolling file (monthly retention, up to 5 months)
    try {
        targets.push({
            target: 'pino-roll',
            options: {
                file: join(serverConfig.logDir, 'magma'),
                frequency: 'daily',
                dateFormat: 'yyyy-MM',
                limit: {
                    count: 5,
                    removeOtherLogFiles: true
                },
                mkdir: true
            },
            level
        });
    } catch (err) {
        console.error('Logger: Failed to initialize pino-roll transport:', err);
    }

    return {
        level,
        transport: { targets }
    };
}

/**
 * Standard Magma Logger (Singleton)
 * 
 * Powered by Pino with monthly rolling log persistence in ./data/logs.
 */
export const logger = pino(getPinoOptions());

export default logger;
