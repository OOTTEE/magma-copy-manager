import '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify';
import { usersService } from '../../../../services/users/users.service';

const userSchema = {
  type: 'object',
  properties: {
    printUser: { type: 'string' },
    nexudusUser: { type: 'string' },
    role: { type: 'string' },
    _links: {
      type: 'object',
      properties: {
        self: { type: 'string' },
        copies: { type: 'string' }
      }
    }
  }
};

const errorSchema = {
  type: 'object',
  properties: {
    trace_id: { type: 'string' },
    error_type: { type: 'string' },
    message: { type: 'string' }
  }
};

const usersRoute: FastifyPluginAsync = async (fastify) => {

  fastify.get('/', {
    schema: {
      description: 'Get all user.',
      tags: ['Users'],
      response: {
        200: { type: 'array', items: userSchema },
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const users = await usersService.getAll();
    const payload = users.map(u => ({
      printUser: u.printUser,
      nexudusUser: u.nexudusUser,
      role: u.role,
      _links: { self: `/api/v1/users/${u.id}`, copies: `/api/v1/users/${u.id}/copies` }
    }));
    return reply.send(payload);
  });

  fastify.get<{ Params: { id: string } }>('/:id', {
    schema: {
      description: 'Get a user.',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      response: {
        200: userSchema,
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = await usersService.getById(request.params.id);
    if (!user) return reply.status(404).send({ error_type: 'not_found', message: 'User not found' });

    return reply.send({
      printUser: user.printUser,
      nexudusUser: user.nexudusUser,
      role: user.role,
      _links: { self: `/api/v1/users/${user.id}`, copies: `/api/v1/users/${user.id}/copies` }
    });
  });

  fastify.post('/', {
    schema: {
      description: 'Add a new user, All fields are mandatory.',
      tags: ['Users'],
      body: {
        type: 'object',
        required: ['username', 'password', 'role', 'printUser', 'nexudusUser'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
          role: { type: 'string' },
          printUser: { type: 'string' },
          nexudusUser: { type: 'string' }
        }
      },
      response: {
        200: userSchema,
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const body: any = request.body;
    const user = await usersService.create(body);
    return reply.send({
      printUser: user.printUser,
      nexudusUser: user.nexudusUser,
      role: user.role,
      _links: { self: `/api/v1/users/${user.id}`, copies: `/api/v1/users/${user.id}/copies` }
    });
  });

  fastify.patch<{ Params: { id: string } }>('/:id', {
    schema: {
      description: 'Update a user. The fields are optional and if not provided will not be updated.',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          printUser: { type: 'string' },
          nexudusUser: { type: 'string' },
          role: { type: 'string' },
          password: { type: 'string' }
        }
      },
      response: {
        200: userSchema,
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const body = request.body;
    const user = await usersService.update(request.params.id, body);
    if (!user) return reply.status(404).send({ error_type: 'not_found', message: 'User not found' });

    return reply.send({
      printUser: user.printUser,
      nexudusUser: user.nexudusUser,
      role: user.role,
      _links: { self: `/api/v1/users/${user.id}`, copies: `/api/v1/users/${user.id}/copies` }
    });
  });

  fastify.delete<{ Params: { id: string } }>('/:id', {
    schema: {
      description: 'Delete a user',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      response: {
        202: { type: 'null' },
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    await usersService.delete(request.params.id);
    return reply.status(202).send();
  });
};

export default usersRoute;
