import { FastifyServerOptions } from 'fastify';
import { serverConfig } from '../config/server.config';

export const loggerConfig: FastifyServerOptions['logger'] = {
    level: serverConfig.logLevel,
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    },
};
