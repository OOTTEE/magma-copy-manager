import { FastifyPluginAsync } from 'fastify';
import { reportsService } from '../../../../services/reports/reports.service';

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
                  total: { type: 'integer' }
                }
              }
            }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const report = await reportsService.getMonthlyAccumulation();
    return reply.send(report);
  });
};

export default reportsRoute;
