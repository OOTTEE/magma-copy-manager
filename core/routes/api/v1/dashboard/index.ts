import { FastifyPluginAsync } from 'fastify';
import { errorSchema } from '../../../../routes/schemas';
import { dashboardFacade } from '../../../../facades/dashboard/dashboard.facade';

export const routes: FastifyPluginAsync = async (app) => {
    // Schema
    const CustomerDashboardResponseSchema = {
        type: 'object',
        properties: {
            currentMonthUsage: {
                type: 'object',
                properties: {
                    totalCost: { type: 'number' },
                    pages: { type: 'number' }
                }
            },
            ytdTotal: { type: 'number' },
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
            recentInvoices: {
                type: 'array'
            }
        }
    };

    app.get('/customer', {
        schema: {
            tags: ['Dashboard'],
            summary: 'Get customer dashboard summary',
            security: [{ bearerAuth: [] }],
            response: {
                200: CustomerDashboardResponseSchema,
                401: errorSchema,
                500: errorSchema
            }
        },
        onRequest: [app.authenticate]
    }, async (request, reply) => {
        try {
            const user = request.user as { id: string };
            const userId = user.id;
            const summary = await dashboardFacade.getDashboardSummary(userId);
            return reply.send(summary);
        } catch (error) {
            request.log.error(error);
            const err = error as any;
            return reply.code(err.statusCode || 500).send({
                error: err.name || 'Internal Server Error',
                message: err.message,
                statusCode: err.statusCode || 500
            });
        }
    });
};

export default routes;
