import { FastifyPluginAsync } from 'fastify';
import { billingFacade } from '../../../../facades/billing/billing.facade';
import { paginationSchema } from '../../../schemas';

// ... (simulations/users/:id stay the same)

const billingRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/simulations/users/:id', {
    schema: {
      description: 'Simulates an invoice for a specific user based on current consumption and settings.',
      tags: ['Billing'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            username: { type: 'string' },
            period: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                to: { type: 'string' }
              }
            },
            lines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  concept: { type: 'string' },
                  quantity: { type: 'integer' },
                  unitPrice: { type: 'number' },
                  total: { type: 'number' }
                }
              }
            },
            total: { type: 'number' }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        404: { type: 'object', properties: { message: { type: 'string' } } },
        500: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const requestingUser = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };

    try {
      const simulation = await billingFacade.simulateInvoice(requestingUser, id);
      return reply.send(simulation);
    } catch (err: any) {
      if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
      return reply.code(500).send({ message: err.message || 'Internal server error during simulation.' });
    }
  });

  /**
   * GET /api/v1/billing/invoices
   * List all persisted invoices with pagination and filtering (Admin only)
   */
  fastify.get<{
    Querystring: {
      page?: number;
      limit?: number;
      userIds?: string | string[];
      months?: string | string[];
    }
  }>('/invoices', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['Billing'],
      description: 'List all persisted invoices with pagination and filtering. Admin only.',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          userIds: { 
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ]
          },
          months: { 
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ]
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  from: { type: 'string' },
                  to: { type: 'string' },
                  total: { type: 'number' }
                }
              }
            },
            pagination: paginationSchema
          }
        }
      }
    },
    handler: async (request, reply) => {
      const user = (request as any).user;
      const { page, limit, userIds, months } = request.query;
      
      const toArray = (val: any) => {
        if (val === undefined || val === null) return undefined;
        return Array.isArray(val) ? val : [val];
      };

      const result = await billingFacade.listInvoices(user, {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        userIds: toArray(userIds),
        months: toArray(months)
      });
      return reply.send(result);
    }
  });

  /**
   * Status check: GET /billing/invoices/users/:id/status
   */
  fastify.get('/invoices/users/:id/status', {
    schema: {
      description: 'Checks if an invoice exists for the current period for a specific user.',
      tags: ['Billing'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const invoice = await billingFacade.getInvoiceStatus(id);
    
    if (!invoice) return reply.code(204).send();
    return reply.send(invoice);
  });

  /**
   * Persist Invoice: POST /billing/invoices
   */
  fastify.post('/invoices', {
    schema: {
      description: 'Persists and generates a real invoice for a user.',
      tags: ['Billing'],
      body: {
        type: 'object',
        properties: { userId: { type: 'string' } },
        required: ['userId']
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const requestingUser = request.user as { id: string; role: string };
    const { userId } = request.body as { userId: string };

    try {
      const result = await billingFacade.persistInvoice(requestingUser, userId);
      return reply.code(201).send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
      return reply.code(500).send({ message: err.message || 'Internal server error during persistence.' });
    }
  });

  /**
   * Delete Invoice: DELETE /billing/invoices/:id
   */
  fastify.delete('/invoices/:id', {
    schema: {
      description: 'Deletes an invoice and releases copies.',
      tags: ['Billing'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const requestingUser = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };

    try {
      await billingFacade.deleteInvoice(requestingUser, id);
      return reply.code(204).send();
    } catch (err: any) {
      if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
      return reply.code(500).send({ message: err.message || 'Internal server error during deletion.' });
    }
  });

  /**
   * Get Invoice Detail: GET /billing/invoices/:id
   */
  fastify.get('/invoices/:id', {
    schema: {
      description: 'Returns detail of a specific invoice.',
      tags: ['Billing'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const requestingUser = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };

    try {
      const invoice = await billingFacade.getInvoice(requestingUser, id);
      return reply.send(invoice);
    } catch (err: any) {
      if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
      return reply.code(500).send({ message: err.message || 'Internal server error fetching invoice.' });
    }
  });
};

export default billingRoute;
