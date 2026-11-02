import '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify';
import { copiesFacade } from '../../../../../../facades/copies/copies.facade';
import { errorSchema, copySchema } from '../../../../../schemas';



const copiesRoute: FastifyPluginAsync = async (fastify) => {

  fastify.get<{ Params: { userId: string }, Querystring: { from?: string, to?: string, period?: string } }>('/', {
    schema: {
      description: 'Get all copies for a user, the from, to, and period are optional.',
      tags: ['Copies'],
      params: {
        type: 'object',
        properties: { userId: { type: 'string' } },
        required: ['userId']
      },
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          period: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }
        }
      },
      response: {
        200: { type: 'array', items: copySchema },
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const { userId } = request.params;
    const { from, to, period } = request.query;
    const user = request.user as { id: string, role: string };

    try {
      const result = await copiesFacade.getUserCopies(user, userId, from, to, period);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        trace_id: request.id,
        error_type: error.statusCode === 403 ? "forbidden" : "internal_server_error",
        message: error.message
      });
    }
  });
};

export default copiesRoute;
