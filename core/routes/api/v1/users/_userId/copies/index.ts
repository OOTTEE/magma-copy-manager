import '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify';
import { copiesService } from '../../../../../../services/copies.service';

const errorSchema = {
  type: 'object',
  properties: {
    trace_id: { type: 'string' },
    error_type: { type: 'string' },
    message: { type: 'string' }
  }
};

const copiesCountSchema = {
  type: 'object',
  properties: {
    a4Color: { type: 'number' },
    a4Bw: { type: 'number' },
    a3Color: { type: 'number' },
    a3Bw: { type: 'number' },
    sra3Color: { type: 'number' },
    sra3Bw: { type: 'number' }
  }
};

const copySchema = {
  type: 'object',
  properties: {
    datetime: { type: 'string', format: 'date-time' },
    count: copiesCountSchema,
    total: copiesCountSchema,
    _links: {
      type: 'object',
      properties: {
        self: { type: 'string' },
        user: { type: 'string' }
      }
    }
  }
};

const copiesRoute: FastifyPluginAsync = async (fastify) => {

  fastify.get<{ Params: { userId: string }, Querystring: { from?: string, to?: string } }>('/', {
    schema: {
      description: 'Get all copies for a user, the from and to are optional.',
      tags: ['Copies'],
      params: {
        type: 'object',
        properties: { userId: { type: 'string' } },
        required: ['userId']
      },
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' }
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
    const { from, to } = request.query;
    const result = await copiesService.getUserCopies(userId, from, to);
    return reply.send(result);
  });

  fastify.put<{ Params: { userId: string } }>('/', {
    schema: {
      description: 'Add copies for a user, Required admin role.',
      tags: ['Copies'],
      params: {
        type: 'object',
        properties: { userId: { type: 'string' } },
        required: ['userId']
      },
      body: copySchema,
      response: {
        200: copySchema,
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const result = await copiesService.addCopies(request.params.userId, request.body);
    return reply.send(result);
  });

  fastify.patch<{ Params: { userId: string, copyId: string } }>('/:copyId', {
    schema: {
      description: 'Update copies for a user, Required admin role.',
      tags: ['Copies'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          copyId: { type: 'string' }
        },
        required: ['userId', 'copyId']
      },
      body: copySchema,
      response: {
        200: copySchema,
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const result = await copiesService.updateCopies(request.params.copyId, request.params.userId, request.body);
    return reply.send(result);
  });

  fastify.delete<{ Params: { userId: string, copyId: string } }>('/:copyId', {
    schema: {
      description: 'Delete copies for a user, Required admin role.',
      tags: ['Copies'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          copyId: { type: 'string' }
        },
        required: ['userId', 'copyId']
      },
      response: {
        202: { type: 'null' },
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    await copiesService.deleteCopies(request.params.copyId, request.params.userId);
    return reply.status(202).send();
  });
};

export default copiesRoute;
