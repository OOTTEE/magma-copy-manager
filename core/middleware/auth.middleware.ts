import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyRequest, FastifyReply } from 'fastify';
import { serverConfig } from '../config/server.config';

export const authMiddleware = fp(async (fastify, opts) => {
    fastify.register(fastifyJwt, {
        secret: serverConfig.jwtSecret
    });

    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({
                trace_id: request.id,
                error_type: "unauthorized",
                message: "Authentication failed or token expired."
            });
        }
    });

    fastify.decorate('requireRole', (role: 'admin' | 'customer') => {
        return async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as { id: string, role: string };
            if (!user || user.role !== role) {
                reply.status(401).send({
                    trace_id: request.id,
                    error_type: "unauthorized",
                    message: `Requires role: ${role}`
                });
            }
        };
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        requireRole: (role: 'admin' | 'customer') => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
