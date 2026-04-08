import { FastifyPluginAsync } from 'fastify';
import { dashboardFacade } from '../../../../facades/dashboard/dashboard.facade';

/**
 * Dashboard Route
 * 
 * Provides endpoints for the administrator dashboard analytics and actions.
 */
const dashboardRoute: FastifyPluginAsync = async (fastify) => {
    /**
     * GET /api/v1/dashboard/stats
     * Returns historical copy volume data for charts.
     */
    fastify.get('/stats', {
        schema: {
            tags: ['Dashboard'],
            description: 'Get historical copy stats for dashboard charts.',
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            month: { type: 'string' },
                            total: { type: 'number' }
                        }
                    }
                }
            }
        },
        preValidation: [fastify.authenticate, fastify.requireRole('admin')]
    }, async () => {
        return await dashboardFacade.getMonthlyStats();
    });

    /**
     * GET /api/v1/dashboard/activity
     * Returns recent activity logs.
     */
    fastify.get('/activity', {
        schema: {
            tags: ['Dashboard'],
            description: 'Get recent system activity logs.',
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            datetime: { type: 'string' },
                            type: { type: 'string' },
                            status: { type: 'string' },
                            message: { type: 'string' }
                        }
                    }
                }
            }
        },
        preValidation: [fastify.authenticate, fastify.requireRole('admin')]
    }, async () => {
        return await dashboardFacade.getActivityLog();
    });

    /**
     * POST /api/v1/dashboard/sync
     * Triggers a manual printer sync.
     */
    fastify.post('/sync', {
        schema: {
            tags: ['Dashboard'],
            description: 'Triggers a manual printer synchronization process.'
        },
        preValidation: [fastify.authenticate, fastify.requireRole('admin')]
    }, async (request) => {
        const user = request.user as { id: string, role: string };
        return await dashboardFacade.runManualSync(user);
    });

    /**
     * POST /api/v1/dashboard/billing
     * Triggers a manual global billing process via async Job.
     */
    fastify.post('/billing', {
        schema: {
            tags: ['Dashboard'],
            description: 'Triggers a manual global billing process to Nexudus.'
        },
        preValidation: [fastify.authenticate, fastify.requireRole('admin')]
    }, async (request) => {
        const user = request.user as { id: string, role: string };
        return await dashboardFacade.runManualBilling(user);
    });

    /**
     * GET /api/v1/dashboard/notifications
     * Returns pending system notifications for the current admin.
     */
    fastify.get('/notifications', {
        schema: {
            tags: ['Dashboard'],
            description: 'Get pending system notifications.'
        },
        preValidation: [fastify.authenticate, fastify.requireRole('admin')]
    }, async (request) => {
        const user = request.user as { id: string, role: string };
        return await dashboardFacade.getPendingNotifications(user.id);
    });

    /**
     * PATCH /api/v1/dashboard/notifications/:id/read
     * Marks a notification as read.
     */
    fastify.patch('/notifications/:id/read', {
        schema: {
            tags: ['Dashboard'],
            description: 'Mark a notification as read.',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                }
            }
        },
        preValidation: [fastify.authenticate, fastify.requireRole('admin')]
    }, async (request) => {
        const { id } = request.params as { id: string };
        return await dashboardFacade.markNotificationAsRead(id);
    });
    /**
     * GET /api/v1/dashboard/customer
     * Returns personal usage and sales history for the current customer.
     */
    fastify.get('/customer', {
        schema: {
            tags: ['Dashboard'],
            description: 'Get personal usage statistics and recent sales for the customer.'
        },
        preValidation: [fastify.authenticate]
    }, async (request) => {
        const user = request.user as { id: string };
        return await dashboardFacade.getCustomerDashboardData(user.id);
    });
};

export default dashboardRoute;
