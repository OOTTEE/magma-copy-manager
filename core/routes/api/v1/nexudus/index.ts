import { FastifyPluginAsync } from 'fastify';
import { nexudusFacade } from '../../../../facades/nexudus/nexudus.facade';

const nexudusRoute: FastifyPluginAsync = async (fastify) => {
  // POST test connection
  fastify.post('/test-connection', {
    schema: {
      tags: ['Nexudus'],
      description: 'Test the connection with Nexudus API.',
      body: {
        type: 'object',
        properties: {
          nexudus_email: { type: 'string', format: 'email' },
          nexudus_password: { type: 'string' },
          nexudus_url: { type: 'string' }
        },
        required: []
      },
      response: {
        200: {
          type: 'object',
          properties: {
            wasSuccessful: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const { nexudus_email, nexudus_password } = request.body as any;

    const result = await nexudusFacade.testConnection(user, {
      email: nexudus_email,
      password: nexudus_password
    });

    return reply.send(result);
  });

  // GET businesses
  fastify.get('/businesses', {
    schema: {
      tags: ['Nexudus'],
      description: 'Get all businesses from Nexudus.',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' }
            }
          }
        },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const businesses = await nexudusFacade.getBusinesses(user);
    return reply.send(businesses);
  });

  // GET currencies
  fastify.get('/currencies', {
    schema: {
      tags: ['Nexudus'],
      description: 'Get all available currencies from Nexudus.',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              code: { type: 'string' }
            }
          }
        },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const currencies = await nexudusFacade.getCurrencies(user);
    return reply.send(currencies);
  });

  // GET products
  fastify.get('/products', {
    schema: {
      tags: ['Nexudus'],
      description: 'Get all available products from Nexudus.',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' }
            }
          }
        },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const products = await nexudusFacade.getProducts(user);
    return reply.send(products);
  });

  // GET coworkers (Search)
  fastify.get('/coworkers', {
    schema: {
      tags: ['Nexudus'],
      description: 'Search coworkers in Nexudus by name or email.',
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              fullName: { type: 'string' },
              email: { type: 'string' }
            }
          }
        },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const { search } = request.query as { search?: string };
    const coworkers = await nexudusFacade.getCoworkers(user, search || '');
    return reply.send(coworkers);
  });

  // GET coworker by ID
  fastify.get<{ Params: { id: string } }>('/coworkers/:id', {
    schema: {
      tags: ['Nexudus'],
      description: 'Get a specific coworker from Nexudus by ID.',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            fullName: { type: 'string' },
            email: { type: 'string' }
          }
        },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        404: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const { id } = request.params;
    try {
      const coworker = await nexudusFacade.getCoworkerById(user, parseInt(id));
      return reply.send(coworker);
    } catch (err: any) {
      if (err.message?.includes('not be found')) {
        return reply.status(404).send({ message: 'Coworker not found' });
      }
      throw err;
    }
  });
};

export default nexudusRoute;
