import { FastifyPluginAsync } from 'fastify';
import { invoicesService } from '../../../../../../services/invoices.service';

const invoicesRoute: FastifyPluginAsync = async (fastify) => {
  // Path: /api/v1/users/:userId/invoices

  fastify.get<{ Params: { userId: string }, Querystring: { from?: string, to?: string } }>('/',
    { preValidation: [fastify.authenticate] }, async (request, reply) => {
      const { userId } = request.params;
      const { from, to } = request.query;
      const result = await invoicesService.getUserInvoices(userId, from, to);
      return reply.send(result);
    });

  fastify.get<{ Params: { userId: string, invoiceId: string } }>('/:invoiceId',
    { preValidation: [fastify.authenticate] }, async (request, reply) => {
      const result = await invoicesService.getInvoiceById(request.params.invoiceId, request.params.userId);
      if (!result) return reply.status(404).send({ error_type: 'not_found', message: 'Invoice not found' });
      return reply.send(result);
    });

  fastify.post<{ Params: { userId: string } }>('/', { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
    const result = await invoicesService.createInvoice(request.params.userId, request.body);
    return reply.send(result);
  });

  fastify.patch<{ Params: { userId: string, invoiceId: string } }>('/:invoiceId', { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
    const result = await invoicesService.updateInvoice(request.params.invoiceId, request.params.userId, request.body);
    return reply.send(result);
  });

  fastify.delete<{ Params: { userId: string, invoiceId: string } }>('/:invoiceId', { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
    await invoicesService.deleteInvoice(request.params.invoiceId, request.params.userId);
    return reply.status(202).send();
  });
};

export default invoicesRoute;
