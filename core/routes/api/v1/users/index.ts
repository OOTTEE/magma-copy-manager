import { FastifyPluginAsync } from 'fastify';
import { usersService } from '../../../../services/users.service';

const usersRoute: FastifyPluginAsync = async (fastify) => {
  // fastify-autoload prefix rule means this executes under /api/v1/users

  fastify.get('/', { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
    const users = await usersService.getAll();
    const payload = users.map(u => ({
      printUser: u.printUser,
      nexudusUser: u.nexudusUser,
      role: u.role,
      _links: { self: `/api/v1/users/${u.id}`, copies: `/api/v1/users/${u.id}/copies` }
    }));
    return reply.send(payload);
  });

  fastify.get<{ Params: { id: string } }>('/:id', { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
    const user = await usersService.getById(request.params.id);
    if (!user) return reply.status(404).send({ error_type: 'not_found', message: 'User not found' });

    return reply.send({
      printUser: user.printUser,
      nexudusUser: user.nexudusUser,
      role: user.role,
      _links: { self: `/api/v1/users/${user.id}`, copies: `/api/v1/users/${user.id}/copies` }
    });
  });

  fastify.post('/', { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
    const body: any = request.body;
    const user = await usersService.create(body);
    return reply.send({
      printUser: user.printUser,
      nexudusUser: user.nexudusUser,
      role: user.role,
      _links: { self: `/api/v1/users/${user.id}`, copies: `/api/v1/users/${user.id}/copies` }
    });
  });

  fastify.patch<{ Params: { id: string } }>('/:id', { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
    const body = request.body;
    const user = await usersService.update(request.params.id, body);
    if (!user) return reply.status(404).send({ error_type: 'not_found', message: 'User not found' });

    return reply.send({
      printUser: user.printUser,
      nexudusUser: user.nexudusUser,
      role: user.role,
      _links: { self: `/api/v1/users/${user.id}`, copies: `/api/v1/users/${user.id}/copies` }
    });
  });

  fastify.delete<{ Params: { id: string } }>('/:id', { preValidation: [fastify.authenticate, fastify.requireRole('admin')] }, async (request, reply) => {
    await usersService.delete(request.params.id);
    return reply.status(202).send();
  });
};

export default usersRoute;
