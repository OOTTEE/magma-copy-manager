import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import AutoLoad from '@fastify/autoload';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { join } from 'path';
import { authMiddleware } from './middleware/auth.middleware';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
    const app = Fastify(opts);

    app.register(swagger, {
        openapi: {
            info: { title: 'Magma API', version: '1.0.0' },
            components: {
                securitySchemes: {
                    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
                }
            }
        }
    });
    app.register(swaggerUi, { routePrefix: '/docs' });

    // Register auth middleware
    app.register(authMiddleware);

    // Auto-load routes
    app.register(AutoLoad, {
        dir: join(__dirname, 'routes'),
        routeParams: true,
        options: { prefix: '/' },
        ignoreFilter: (path) => path.endsWith('.test.ts') || path.endsWith('testEnv.ts')
    });

    return app;
}
