import { FastifyPluginAsync } from 'fastify';
import { reportsFacade } from '../../../../facades/reports/reports.facade';

const reportsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/monthly', {
    schema: {
      description: 'Get accumulated copy counts for a given period or all pending.',
      tags: ['Reports'],
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          includeAllPending: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            period: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                to: { type: 'string' },
                allPending: { type: 'boolean' }
              }
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  printUser: { type: 'string' },
                  a4Color: { type: 'integer' },
                  a4Bw: { type: 'integer' },
                  a3Color: { type: 'integer' },
                  a3Bw: { type: 'integer' },
                  sra3Color: { type: 'integer' },
                  sra3Bw: { type: 'integer' },
                  a3NoPaperMode: { type: 'boolean' },
                  total: { type: 'integer' }
                }
              }
            }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const query = request.query as { from?: string; to?: string; includeAllPending?: boolean | string };
    
    // Fastify might pass boolean as string if not using type coercion properly
    const includeAllPending = query.includeAllPending === true || query.includeAllPending === 'true';

    const report = await reportsFacade.getMonthlyAccumulation(user, {
        from: query.from,
        to: query.to,
        includeAllPending
    });
    return reply.send(report);
  });
};

export default reportsRoute;
