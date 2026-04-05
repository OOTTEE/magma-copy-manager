import { FastifyPluginAsync } from 'fastify';
import { automationFacade } from '../../../../facades/automation/automation.facade';

/**
 * Automation Routes
 * 
 * Exposes endpoints for managing and auditing automated tasks.
 */
const automationRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /api/v1/automation/logs
     * Returns history of auto-billing executions.
     */
    fastify.get('/logs', {
        schema: {
            description: 'Get auto-billing execution logs.',
            tags: ['Automation'],
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', default: 20 },
                    offset: { type: 'integer', default: 0 }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            datetime: { type: 'string' },
                            status: { type: 'string' },
                            details: { type: 'array' }
                        }
                    }
                }
            }
        },
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        const user = request.user as { id: string; role: string };
        const { limit, offset } = request.query as { limit?: number; offset?: number };
        
        try {
            const logs = await automationFacade.getLogs(user, limit, offset);
            return reply.send(logs);
        } catch (err: any) {
            if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
            throw err;
        }
    });

    /**
     * POST /api/v1/automation/trigger
     * Manually triggers the auto-billing process.
     */
    fastify.post('/trigger', {
        schema: {
            description: 'Manually trigger the auto-billing process.',
            tags: ['Automation'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        logId: { type: 'string' },
                        status: { type: 'string' },
                        results: { type: 'array' }
                    }
                }
            }
        },
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        const user = request.user as { id: string; role: string };
        
        try {
            const result = await automationFacade.triggerAutoBilling(user);
            return reply.send(result);
        } catch (err: any) {
            if (err.statusCode) return reply.code(err.statusCode).send({ message: err.message });
            throw err;
        }
    });
};

export default automationRoutes;
