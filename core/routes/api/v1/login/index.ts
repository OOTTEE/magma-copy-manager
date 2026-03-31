import { FastifyPluginAsync, FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify';
import { authService } from '../../../../services/auth/auth.service';

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
                    token: { type: 'string' }
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
        const token = await authService.login(fastify, username, password);

        if (!token) {
            reply.status(401).send({
                trace_id: request.id,
                error_type: "unauthorized",
                message: "Invalid credentials"
            });
            return;
        }

        return { token };
    });
};

export default loginRoute;
