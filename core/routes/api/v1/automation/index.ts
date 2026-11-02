import { FastifyPluginAsync } from 'fastify';
import { automationFacade } from '../../../../facades/automation/automation.facade';

/**
 * Automation Routes
 *
 * Exposes endpoints for managing and auditing automated tasks.
 */
const automationRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /api/v1/automation/periods
     * Returns available billing periods for filtering automation logs.
     */
    fastify.get('/periods', {
        schema: {
            description: 'Get available billing periods for automation logs. Admin only.',
            tags: ['Automation'],
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
                            status: { type: 'string' }
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
        const periods = await automationFacade.getPeriods(user);
        return reply.send(periods);
    });

    /**
     * GET /api/v1/automation/logs
     * Returns history of automation executions with filtering and pagination.
     */
    fastify.get('/logs', {
        schema: {
            description: 'Get automation execution logs with filtering. Admin only.',
            tags: ['Automation'],
            querystring: {
                type: 'object',
                properties: {
                    period: { type: 'string' },
                    from: { type: 'string' },
                    to: { type: 'string' },
                    status: { type: 'string', enum: ['all', 'success', 'partial', 'failed'] },
                    processType: { type: 'string', enum: ['all', 'sync', 'billing'] },
                    limit: { type: 'integer', default: 20 },
                    offset: { type: 'integer', default: 0 }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        pagination: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer' },
                                limit: { type: 'integer' },
                                offset: { type: 'integer' }
                            }
                        },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    datetime: { type: 'string' },
                                    status: { type: 'string' },
                                    triggerType: { type: 'string' },
                                    processType: { type: 'string' },
                                    summary: { type: 'string' },
                                    stats: {
                                        type: 'object',
                                        properties: {
                                            errorsCount: { type: 'integer' },
                                            changedCount: { type: 'integer' },
                                            unchangedCount: { type: 'integer' }
                                        }
                                    },
                                    details: {
                                        type: 'object',
                                        additionalProperties: true
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
            status?: string;
            processType?: string;
            limit?: number;
            offset?: number;
        };

        const logs = await automationFacade.getLogs(user, query);
        return reply.send(logs);
    });

    /**
     * POST /api/v1/automation/trigger
     * Manually triggers the auto-billing process.
     */
    fastify.post('/trigger', {
        schema: {
            description: 'Manually trigger the auto-billing process. Admin only.',
            tags: ['Automation'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        logId: { type: 'string' },
                        status: { type: 'string' },
                        results: { type: 'array' }
                    }
                },
                401: { type: 'object', properties: { message: { type: 'string' } } },
                403: { type: 'object', properties: { message: { type: 'string' } } }
            }
        },
        preValidation: [fastify.authenticate, fastify.requireRole('admin')]
    }, async (request, reply) => {
        const user = request.user as { id: string; role: string };
        const result = await automationFacade.triggerAutoBilling(user);
        return reply.send(result);
    });

    /**
     * POST /api/v1/automation/sync
     * Manually triggers the printer synchronization process.
     */
    fastify.post('/sync', {
        schema: {
            description: 'Manually trigger the printer synchronization process. Admin only.',
            tags: ['Automation'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        logId: { type: 'string' },
                        status: { type: 'string' },
                        summary: { type: 'string' }
                    }
                },
                401: { type: 'object', properties: { message: { type: 'string' } } },
                403: { type: 'object', properties: { message: { type: 'string' } } }
            }
        },
        preValidation: [fastify.authenticate, fastify.requireRole('admin')]
    }, async (request, reply) => {
        const user = request.user as { id: string; role: string };
        const result = await automationFacade.triggerSync(user);
        return reply.send(result);
    });
};

export default automationRoutes;
