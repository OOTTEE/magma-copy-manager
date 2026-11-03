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
            description: 'Get personal usage statistics and recent sales for the customer.',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        userId: { type: 'string' },
                        isMultiAccount: { type: 'boolean' },
                        accountsCount: { type: 'number' },
                        currentPeriod: {
                            type: 'object',
                            properties: {
                                month: { type: 'string' },
                                from: { type: 'string' },
                                to: { type: 'string' },
                                total: { type: 'number' },
                                a4Bw: { type: 'number' },
                                a4Color: { type: 'number' },
                                a3Bw: { type: 'number' },
                                a3Color: { type: 'number' },
                                sra3Bw: { type: 'number' },
                                sra3Color: { type: 'number' },
                                isOverAllocated: { type: 'boolean' },
                                syncedCopies: { type: 'number' },
                                pendingCopies: { type: 'number' }
                            }
                        },
                        historicalCycles: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    month: { type: 'string' },
                                    periodName: { type: 'string' },
                                    saleDate: { type: 'string' },
                                    totalCopies: { type: 'number' },
                                    accountsCount: { type: 'number' },
                                    accounts: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                accountId: { type: 'string' },
                                                nexudusUserId: { type: 'string' },
                                                accountName: { type: 'string' },
                                                isDefault: { type: 'number' },
                                                totalCopies: { type: 'number' },
                                                a4Bw: { type: 'number' },
                                                a4Color: { type: 'number' },
                                                a3Bw: { type: 'number' },
                                                a3Color: { type: 'number' },
                                                sra3Bw: { type: 'number' },
                                                sra3Color: { type: 'number' },
                                                concepts: { type: 'array', items: { type: 'string' } }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        ytdMonthlyExpenses: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    month: { type: 'string' },
                                    total: { type: 'number' }
                                }
                            }
                        },
                        currentMonthUsage: {
                            type: 'object',
                            properties: {
                                count: { type: 'number' }
                            }
                        },
                        ytdTotal: { type: 'number' },
                        recentInvoices: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    from: { type: 'string' },
                                    to: { type: 'string' },
                                    total: { type: 'number' },
                                    status: { type: 'string' }
                                }
                            }
                        },
                        pendingConsumption: { type: ['object', 'null'], additionalProperties: true }
                    }
                }
            }
        },
        preValidation: [fastify.authenticate]
    }, async (request) => {
        const user = request.user as { id: string };
        return await dashboardFacade.getCustomerDashboardData(user.id);
    });
};

export default dashboardRoute;
