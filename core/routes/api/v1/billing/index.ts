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
   * GET /api/v1/billing/sync
   * List all synchronization events with pagination and filtering (Admin only)
   */
  fastify.get<{
    Querystring: {
      page?: number;
      limit?: number;
      userIds?: string | string[];
      months?: string | string[];
    }
  }>('/sync', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['Billing'],
      description: 'List all synchronization events with pagination and filtering. Admin only.',
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
                  month: { type: 'string' },
                  type: { type: 'string' },
                  quantity: { type: 'integer' },
                  nexudusSaleId: { type: 'string' },
                  createdOn: { type: 'string' }
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

      const result = await billingFacade.listSyncHistory(user, {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        userIds: toArray(userIds),
        months: toArray(months)
      });
      return reply.send(result);
    }
  });

  /**
   * Status check: GET /billing/sync/users/:id/status
   */
  fastify.get('/sync/users/:id/status', {
    schema: {
      description: 'Checks if consumption has been synced for a user in the current month.',
      tags: ['Billing'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await billingFacade.getSyncStatus(id);
    
    if (!result.synced) return reply.code(204).send();
    return reply.send(result);
  });

  /**
   * Sync User: POST /billing/sync
   */
  fastify.post('/sync', {
    schema: {
      description: 'Synchronizes current month consumption for a user to Nexudus.',
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
      const result = await billingFacade.syncUserConsumption(requestingUser, userId);
      return reply.code(201).send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
      return reply.code(500).send({ message: err.message || 'Internal server error during sync.' });
    }
  });

  /**
   * Get Sync Detail: GET /billing/sync/:id
   */
  fastify.get('/sync/:id', {
    schema: {
      description: 'Returns detail of a specific sync event.',
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
      const result = await billingFacade.getSyncDetails(requestingUser, id);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
      return reply.code(500).send({ message: err.message || 'Internal server error fetching sync details.' });
    }
  });

  /**
   * Nexudus Sync: POST /sync/nexudus
   */
  fastify.post('/sync/nexudus', {
    schema: {
      description: 'Synchronizes monthly consumption with Nexudus. Admin only.',
      tags: ['Billing'],
      response: {
        200: {
          type: 'object',
          properties: {
            month: { type: 'string' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  salesCreated: { type: 'integer' },
                  skipped: { type: 'integer' },
                  errors: { type: 'integer' }
                }
              }
            }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        500: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const requestingUser = request.user as { id: string; role: string };

    try {
      const result = await billingFacade.syncWithNexudus(requestingUser);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
      return reply.code(500).send({ message: err.message || 'Internal server error during Nexudus sync.' });
    }
  });

  /**
   * GET /api/v1/billing/stats
   * Global sales and sync statistics for admin dashboard.
   */
  fastify.get('/stats', {
    schema: {
      tags: ['Billing'],
      description: 'Get global sales and sync statistics. Admin only.',
      response: {
        200: {
          type: 'object',
          properties: {
            totalSalesThisMonth: { type: 'integer' },
            usersPendingSync: { type: 'integer' },
            period: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                to: { type: 'string' }
              }
            }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        500: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const requestingUser = request.user as { id: string; role: string };
    try {
      const stats = await billingFacade.getSalesStats(requestingUser);
      return reply.send(stats);
    } catch (err: any) {
      if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
      return reply.code(500).send({ message: err.message || 'Internal server error fetching billing stats.' });
    }
  });

  /**
   * DELETE /api/v1/billing/sync/:id?force=true
   * Performs an automated rollback of a specific sync event. Admin only.
   */
  fastify.delete<{
    Params: { id: string };
    Querystring: { force?: boolean };
  }>('/sync/:id', {
    schema: {
      tags: ['Billing'],
      description: 'Rollback a specific synchronization event. Deletes in Nexudus and releases copies in Magma.',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          force: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            localId: { type: 'string' },
            remoteId: { type: 'integer' },
            status: { type: 'string' }
          }
        },
        400: { type: 'object', properties: { message: { type: 'string' } } },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        500: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const { force } = request.query;
    const requestingUser = request.user as { id: string; role: string };
    try {
      const result = await billingFacade.rollbackSyncEvent(id, requestingUser, !!force);
      return reply.send(result);
    } catch (err: any) {
      if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
      return reply.code(500).send({ message: err.message || 'Internal server error during rollback.' });
    }
  });
};

export default billingRoute;
