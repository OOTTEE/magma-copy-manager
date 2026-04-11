import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import AutoLoad from '@fastify/autoload';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import { authMiddleware } from './middleware/auth.middleware';
import { serverConfig } from './config/server.config';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
    const app = Fastify(opts);

    // Enable CORS for development
    app.register(cors, {
        origin: process.env.NODE_ENV !== 'production',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    });

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
        ignoreFilter: (path) => {
            return /\.(test|spec)\.(ts|js)$/.test(path) || 
                   /testEnv\.ts$/.test(path) || 
                   /routes\/index\.ts$/.test(path) || 
                   /routes\/schemas\.ts$/.test(path);
        }
    });

    // Serve static files from 'public' folder (production frontend build)
    app.register(fastifyStatic, {
        root: join(__dirname, serverConfig.publicFolder), // In production, this will be dist/public
        prefix: '/',
        wildcard: false,
    });

    // Provide SPA routing: serve index.html for any non-API route that is not found
    app.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith('/api') || request.url.startsWith('/docs')) {
            reply.status(404).send({ 
                error: 'Not Found', 
                message: `Route ${request.method}:${request.url} not found` 
            });
            return;
        }
        // For everything else, serve index.html to allow SPA routing
        reply.sendFile('index.html');
    });

    return app;
}
