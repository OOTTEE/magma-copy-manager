import { FastifyPluginAsync } from 'fastify';
import { reportsFacade } from '../../../../facades/reports/reports.facade';

const reportsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/monthly', {
    schema: {
      description: 'Get accumulated copy counts for the current monthly period (27th to 27th).',
      tags: ['Reports'],
      response: {
        200: {
          type: 'object',
          properties: {
            period: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                to: { type: 'string' }
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
    const report = await reportsFacade.getMonthlyAccumulation(user);
    return reply.send(report);
  });
};

export default reportsRoute;
