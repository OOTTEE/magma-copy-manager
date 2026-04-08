import { FastifyPluginAsync, FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify';
import { authFacade } from '../../../../facades/auth/auth.facade';

const schema: RouteShorthandOptions = {
    schema: {
        body: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
                username: { type: 'string' },
                password: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    role: { type: 'string' },
                    username: { type: 'string' }
                }
            },
            401: {
                type: 'object',
                properties: {
                    trace_id: { type: 'string' },
                    error_type: { type: 'string' },
                    message: { type: 'string' }
                }
            }
        }
    }
};

const loginRoute: FastifyPluginAsync = async (fastify, opts) => {
    fastify.post('/', schema, async (request: FastifyRequest, reply: FastifyReply) => {
        const { username, password } = request.body as any;
        
        try {
            const result = await authFacade.login(fastify, username, password);
            return result;
        } catch (error: any) {
            if (error.statusCode === 401) {
                return reply.code(401).send({
                    trace_id: request.id,
                    error_type: error.errorType || "unauthorized",
                    message: error.message
                });
            }
            throw error;
        }
    });
};

export default loginRoute;
