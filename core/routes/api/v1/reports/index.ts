import { FastifyPluginAsync } from 'fastify';
import { reportsFacade } from '../../../../facades/reports/reports.facade';

const reportsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/reports/periods
   * Discovers and lists all monthly billing periods with aggregate metrics.
   */
  fastify.get('/periods', {
    schema: {
      description: 'Get all available billing periods with macro metrics. Admin only.',
      tags: ['Reports'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 12 }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              name: { type: 'string' },
              from: { type: 'string' },
              to: { type: 'string' },
              isCurrent: { type: 'boolean' },
              status: { type: 'string' },
              metrics: {
                type: 'object',
                properties: {
                  totalCopies: { type: 'integer' },
                  linkedCopies: { type: 'integer' },
                  pendingCopies: { type: 'integer' },
                  syncedCopies: { type: 'integer' },
                  unlinkedUsersCount: { type: 'integer' },
                  totalUsersCount: { type: 'integer' }
                }
              }
            }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const query = request.query as { limit?: number };
    const periods = await reportsFacade.getAvailablePeriods(user, query.limit || 12);
    return reply.send(periods);
  });

  /**
   * GET /api/v1/reports/monthly
   * Returns accumulated copy counts categorized into linked vs pending copies.
   */
  fastify.get('/monthly', {
    schema: {
      description: 'Get accumulated copy counts for a given period or all pending. Admin only.',
      tags: ['Reports'],
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string' },
          from: { type: 'string' },
          to: { type: 'string' },
          includeAllPending: { type: 'boolean' },
          filter: { type: 'string', enum: ['linked', 'unlinked', 'all'], default: 'linked' },
          includeIgnored: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            period: {
              type: 'object',
              properties: {
                month: { type: 'string' },
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
                  userId: { type: 'string' },
                  username: { type: 'string' },
                  printUser: { type: 'string' },
                  nexudusUser: { type: ['string', 'null'] },
                  role: { type: 'string' },
                  isIgnored: { type: 'boolean' },
                  hasLinkedAccount: { type: 'boolean' },
                  accountsCount: { type: 'integer' },
                  status: { type: 'string' },
                  a4Color: { type: 'integer' },
                  a4Bw: { type: 'integer' },
                  a3Color: { type: 'integer' },
                  a3Bw: { type: 'integer' },
                  sra3Color: { type: 'integer' },
                  sra3Bw: { type: 'integer' },
                  a3NoPaperMode: { type: 'boolean' },
                  total: { type: 'integer' },
                  copies: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      linked: { type: 'integer' },
                      pending: { type: 'integer' },
                      synced: { type: 'integer' },
                      byType: {
                        type: 'object',
                        additionalProperties: true
                      }
                    }
                  },
                  accounts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        nexudusUserId: { type: 'string' },
                        isDefault: { type: 'boolean' },
                        createdOn: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const query = request.query as {
      period?: string;
      from?: string;
      to?: string;
      includeAllPending?: boolean | string;
      filter?: 'linked' | 'unlinked' | 'all';
      includeIgnored?: boolean | string;
    };

    const includeAllPending = query.includeAllPending === true || query.includeAllPending === 'true';
    const includeIgnored = query.includeIgnored === true || query.includeIgnored === 'true';

    const report = await reportsFacade.getMonthlyAccumulation(user, {
      period: query.period,
      from: query.from,
      to: query.to,
      includeAllPending,
      filter: query.filter || 'linked',
      includeIgnored
    });
    return reply.send(report);
  });

  /**
   * GET /api/v1/reports/orphans
   * Returns users with prints who are not linked to any Nexudus account and not ignored.
   */
  fastify.get('/orphans', {
    schema: {
      description: 'Get orphan printer users without linked Nexudus accounts. Admin only.',
      tags: ['Reports'],
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              printUser: { type: 'string' },
              totalCopies: { type: 'integer' },
              a4Color: { type: 'integer' },
              a4Bw: { type: 'integer' },
              a3Color: { type: 'integer' },
              a3Bw: { type: 'integer' },
              sra3Color: { type: 'integer' },
              sra3Bw: { type: 'integer' }
            }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const query = request.query as { period?: string };
    const orphans = await reportsFacade.getUnlinkedOrphans(user, query.period);
    return reply.send(orphans);
  });
};

export default reportsRoute;
