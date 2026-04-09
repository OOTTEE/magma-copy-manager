import { FastifyPluginAsync } from 'fastify';
import { copiesRepository } from '../../../../repositories/copies.repository';

const copySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    username: { type: 'string' },
    datetime: { type: 'string' },
    a4Bw: { type: 'number' },
    a4Color: { type: 'number' },
    a3Bw: { type: 'number' },
    a3Color: { type: 'number' },
    a4BwTotal: { type: 'number' },
    a4ColorTotal: { type: 'number' },
    a3BwTotal: { type: 'number' },
    a3ColorTotal: { type: 'number' },
    isSynced: { type: 'boolean' }
  }
};

const errorSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' }
  }
};

const copiesRoute: FastifyPluginAsync = async (fastify) => {

  fastify.get('/', {
    schema: {
      description: 'Get all copy increments sorted by date.',
      tags: ['Copies'],
      response: {
        200: { type: 'array', items: copySchema },
        401: errorSchema,
        403: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const payload = await copiesRepository.findAll();
    return reply.send(payload);
  });

  fastify.delete('/batch', {
    schema: {
      description: 'Delete multiple copy increments.',
      tags: ['Copies'],
      body: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } }
        }
      },
      response: {
        204: { type: 'null' },
        400: errorSchema,
        401: errorSchema,
        403: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const { ids } = request.body as { ids: string[] };
    if (!ids || ids.length === 0) {
      return reply.status(400).send({ message: 'No IDs provided' });
    }
    await copiesRepository.deleteMany(ids);
    return reply.status(204).send();
  });
};

export default copiesRoute;
