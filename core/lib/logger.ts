import pino from 'pino';
import { join } from 'path';
import { serverConfig } from '../config/server.config';

/**
 * Creates Pino transports based on the environment.
 * In development and production, streams to stdout while simultaneously rolling logs to disk.
 * In test environment, uses standard in-memory output to prevent file I/O contention.
 */
function createLoggerTransport() {
    if (process.env.NODE_ENV === 'test') {
        return undefined;
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
            level: serverConfig.logLevel || 'info'
        });
    } else {
        targets.push({
            target: 'pino/file',
            options: { destination: 1 }, // stdout
            level: serverConfig.logLevel || 'info'
        });
    }

    // Target 2: Persistent rolling file (monthly retention, up to 5 months)
    try {
        targets.push({
            target: require.resolve('pino-roll'),
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
            level: serverConfig.logLevel || 'info'
        });
    } catch (err) {
        // Fallback if pino-roll cannot be resolved in strange environments
        console.error('Logger: Failed to initialize pino-roll transport:', err);
    }

    return pino.transport({ targets });
}

/**
 * Standard Magma Logger (Singleton)
 * 
 * Powered by Pino with monthly rolling log persistence in ./data/logs.
 */
export const logger = pino(
    {
        level: serverConfig.logLevel || 'info',
    },
    createLoggerTransport()
);

export default logger;
