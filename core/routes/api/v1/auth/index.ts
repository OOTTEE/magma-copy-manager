import { FastifyPluginAsync } from 'fastify';

/**
 * Auth Route
 * 
 * Provides session validation and user profile information.
 * All routes here are protected by JWT.
 */
const authRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', {
    schema: {
      tags: ['Auth'],
      description: 'Get current user profile if token is valid.',
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    // request.user is set by fastify.authenticate (request.jwtVerify())
    return reply.send(request.user);
  });
};

export default authRoute;
