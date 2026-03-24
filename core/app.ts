import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import AutoLoad from '@fastify/autoload';
import { join } from 'path';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
    const app = Fastify(opts);

    // Auto-load routes
    app.register(AutoLoad, {
        dir: join(__dirname, 'routes'),
        options: { prefix: '/' }
    });

    return app;
}
