import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import AutoLoad from '@fastify/autoload';
import { join } from 'path';
import { authMiddleware } from './middleware/auth.middleware';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
    const app = Fastify(opts);

    // Register auth middleware
    app.register(authMiddleware);

    // Auto-load routes
    app.register(AutoLoad, {
        dir: join(__dirname, 'routes'),
        routeParams: true,
        options: { prefix: '/' }
    });

    return app;
}
