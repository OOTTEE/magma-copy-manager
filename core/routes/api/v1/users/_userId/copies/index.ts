import { FastifyPluginAsync } from 'fastify';
import { copiesService } from '../../../../../../services/copies.service';

const copiesRoute: FastifyPluginAsync = async (fastify) => {
  // Path under fastify-autoload: /api/v1/users/:userId/copies

  fastify.get<{ Params: { userId: string }, Querystring: { from?: string, to?: string } }>('/',
    { preValidation: [fastify.authenticate] }, async (request, reply) => {
      const { userId } = request.params;
      const { from, to } = request.query;
      const result = await copiesService.getUserCopies(userId, from, to);
      return reply.send(result);
    });

  fastify.put<{ Params: { userId: string } }>('/',
    { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
      const result = await copiesService.addCopies(request.params.userId, request.body);
      return reply.send(result);
    });

  fastify.patch<{ Params: { userId: string, copyId: string } }>('/:copyId',
    { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
      const result = await copiesService.updateCopies(request.params.copyId, request.params.userId, request.body);
      return reply.send(result);
    });

  fastify.delete<{ Params: { userId: string, copyId: string } }>('/:copyId',
    { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
      await copiesService.deleteCopies(request.params.copyId, request.params.userId);
      return reply.status(202).send();
    });
};

export default copiesRoute;
