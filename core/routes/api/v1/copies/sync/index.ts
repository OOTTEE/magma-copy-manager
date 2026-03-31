import { FastifyPluginAsync } from 'fastify';
import { copiesFacade } from '../../../../../facades/copies/copies.facade';
import { errorSchema, syncResponseSchema } from '../../../../schemas';

const syncRoute: FastifyPluginAsync = async (fastify) => {
    fastify.post('/', {
        schema: {
            description: 'Triggers the printer copies synchronization. Downloads report, calculates increments and persists data. Admin only.',
            tags: ['Copies'],
            body: {
                type: 'object',
                properties: {}
            },
            response: {
                200: syncResponseSchema,
                401: errorSchema,
                403: errorSchema,
                500: errorSchema
            }
        },
        preValidation: [fastify.authenticate, fastify.requireRole('admin')]
    }, async (request, reply) => {
        const user = request.user as { id: string; role: string };
        try {
            const results = await copiesFacade.syncPrinterCopies(user);
            return reply.send(results);
        } catch (error: any) {
            return reply.status(error.statusCode || 500).send({
                trace_id: request.id,
                error_type: "sync_error",
                message: error.message
            });
        }
    });
};

export default syncRoute;
