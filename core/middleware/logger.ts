import { FastifyServerOptions } from 'fastify';

export const loggerConfig: FastifyServerOptions['logger'] = {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    },
};
