import '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify';
import { invoicesService } from '../../../../../../services/invoices.service';

const errorSchema = {
  type: 'object',
  properties: {
    trace_id: { type: 'string' },
    error_type: { type: 'string' },
    message: { type: 'string' }
  }
};

const invoiceItemSchema = {
  type: 'object',
  properties: {
    concept: { type: 'string' },
    quantity: { type: 'number' },
    unitPrice: { type: 'number' },
    total: { type: 'number' },
    _links: {
      type: 'object',
      properties: {
        self: { type: 'string' },
        invoice: { type: 'string' }
      }
    }
  }
};

const invoiceSchema = {
  type: 'object',
  properties: {
    from: { type: 'string', format: 'date' },
    to: { type: 'string', format: 'date' },
    total: { type: 'number' },
    items: { type: 'array', items: invoiceItemSchema },
    _links: {
      type: 'object',
      properties: {
        self: { type: 'string' },
        user: { type: 'string' },
        items: { type: 'string' }
      }
    }
  }
};

const invoicesRoute: FastifyPluginAsync = async (fastify) => {

  fastify.get<{ Params: { userId: string }, Querystring: { from?: string, to?: string } }>('/', {
    schema: {
      description: 'Get all invoices for a user.',
      tags: ['Invoices'],
      params: {
        type: 'object',
        properties: { userId: { type: 'string' } },
        required: ['userId']
      },
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' }
        }
      },
      response: {
        200: { type: 'array', items: invoiceSchema },
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const { userId } = request.params;
    const { from, to } = request.query;
    const result = await invoicesService.getUserInvoices(userId, from, to);
    return reply.send(result);
  });

  fastify.get<{ Params: { userId: string, invoiceId: string } }>('/:invoiceId', {
    schema: {
      description: 'Get an invoice for a user.',
      tags: ['Invoices'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          invoiceId: { type: 'string' }
        },
        required: ['userId', 'invoiceId']
      },
      response: {
        200: invoiceSchema,
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const result = await invoicesService.getInvoiceById(request.params.invoiceId, request.params.userId);
    if (!result) return reply.status(404).send({ error_type: 'not_found', message: 'Invoice not found' });
    return reply.send(result);
  });

  fastify.post<{ Params: { userId: string } }>('/', {
    schema: {
      description: 'Create an invoice for a user, Required admin role.',
      tags: ['Invoices'],
      params: {
        type: 'object',
        properties: { userId: { type: 'string' } },
        required: ['userId']
      },
      body: invoiceSchema,
      response: {
        200: invoiceSchema,
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const result = await invoicesService.createInvoice(request.params.userId, request.body);
    return reply.send(result);
  });

  fastify.patch<{ Params: { userId: string, invoiceId: string } }>('/:invoiceId', {
    schema: {
      description: 'Update an invoice for a user, Required admin role.',
      tags: ['Invoices'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          invoiceId: { type: 'string' }
        },
        required: ['userId', 'invoiceId']
      },
      body: invoiceSchema,
      response: {
        200: invoiceSchema,
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const result = await invoicesService.updateInvoice(request.params.invoiceId, request.params.userId, request.body);
    return reply.send(result);
  });

  fastify.delete<{ Params: { userId: string, invoiceId: string } }>('/:invoiceId', {
    schema: {
      description: 'Delete an invoice for a user, Required admin role.',
      tags: ['Invoices'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          invoiceId: { type: 'string' }
        },
        required: ['userId', 'invoiceId']
      },
      response: {
        202: { type: 'null' },
        401: errorSchema,
        500: errorSchema
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    await invoicesService.deleteInvoice(request.params.invoiceId, request.params.userId);
    return reply.status(202).send();
  });
};

export default invoicesRoute;
