import '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify';
import { usersFacade } from '../../../../facades/users/users.facade';

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    username: { type: 'string' },
    printUser: { type: 'string' },
    nexudusUser: { type: 'string' },
    role: { type: 'string' },
    a3NoPaperMode: { type: 'number' },
    _links: {
      type: 'object',
      properties: {
        self: { type: 'string' },
        copies: { type: 'string' }
      }
    }
  }
};

const nexudusAccountSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    nexudusUserId: { type: 'string' },
    isDefault: { type: 'number' },
    createdOn: { type: 'string' }
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
        403: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const payload = await usersFacade.getAllUsers(user);
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
        403: errorSchema,
        404: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    try {
      const result = await usersFacade.getUserById(user, request.params.id);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode === 404) return reply.status(404).send({ error_type: 'not_found', message: err.message });
      throw err;
    }
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
          nexudusUser: { type: 'string' },
          a3NoPaperMode: { type: 'number' }
        }
      },
      response: {
        200: userSchema,
        401: errorSchema,
        403: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const body: any = request.body;
    const result = await usersFacade.createUser(user, body);
    return reply.send(result);
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
          password: { type: 'string' },
          a3NoPaperMode: { type: 'number' }
        }
      },
      response: {
        200: userSchema,
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const body = request.body;
    try {
      const result = await usersFacade.updateUser(user, request.params.id, body);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode === 404) return reply.status(404).send({ error_type: 'not_found', message: err.message });
      throw err;
    }
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
        403: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    await usersFacade.deleteUser(user, request.params.id);
    return reply.status(202).send();
  });

  // --- Nexudus Accounts Management ---

  fastify.get<{ Params: { id: string } }>('/:id/nexudus-accounts', {
    schema: {
      description: 'Get all Nexudus accounts for a user.',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      response: {
        200: { type: 'array', items: nexudusAccountSchema },
        401: errorSchema,
        403: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const result = await usersFacade.getNexudusAccounts(user, request.params.id);
    return reply.send(result);
  });

  fastify.post<{ Params: { id: string }, Body: { nexudusUserId: string } }>('/:id/nexudus-accounts', {
    schema: {
      description: 'Add a new Nexudus account to a user.',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['nexudusUserId'],
        properties: { nexudusUserId: { type: 'string' } }
      },
      response: {
        201: nexudusAccountSchema,
        401: errorSchema,
        403: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const result = await usersFacade.addNexudusAccount(user, request.params.id, request.body.nexudusUserId);
    return reply.status(201).send(result);
  });

  fastify.delete<{ Params: { id: string, accountId: string } }>('/:id/nexudus-accounts/:accountId', {
    schema: {
      description: 'Delete a Nexudus account.',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { 
          id: { type: 'string' },
          accountId: { type: 'string' }
        },
        required: ['id', 'accountId']
      },
      response: {
        204: { type: 'null' },
        401: errorSchema,
        403: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    await usersFacade.deleteNexudusAccount(user, request.params.accountId);
    return reply.status(204).send();
  });

  fastify.patch<{ Params: { id: string, accountId: string } }>('/:id/nexudus-accounts/:accountId/default', {
    schema: {
      description: 'Set a Nexudus account as default.',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { 
          id: { type: 'string' },
          accountId: { type: 'string' }
        },
        required: ['id', 'accountId']
      },
      response: {
        204: { type: 'null' },
        401: errorSchema,
        403: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    await usersFacade.setDefaultNexudusAccount(user, request.params.id, request.params.accountId);
    return reply.status(204).send();
  });
};

export default usersRoute;
