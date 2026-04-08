import { FastifyPluginAsync } from 'fastify';
import { authFacade } from '../../../../facades/auth/auth.facade';

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
  /**
   * POST /api/v1/auth/refresh
   * Interchanges a valid refresh token for a new token pair.
   */
  fastify.post('/refresh', {
    schema: {
      tags: ['Auth'],
      description: 'Refresh access token using a valid refresh token.',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            role: { type: 'string' }
          }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } }
      }
    }
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    try {
      const result = await authFacade.refreshAccessToken(fastify, refreshToken);
      return reply.send(result);
    } catch (err: any) {
      return reply.code(401).send({ message: err.message || 'Invalid refresh token.' });
    }
  });

  /**
   * POST /api/v1/auth/logout
   * Revokes the provided refresh token.
   */
  fastify.post('/logout', {
    schema: {
      tags: ['Auth'],
      description: 'Logout by revoking the refresh token.',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      },
      response: {
        204: { type: 'null' },
        400: { type: 'object', properties: { message: { type: 'string' } } }
      }
    }
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    await authFacade.logout(refreshToken);
    return reply.code(204).send();
  });
};

export default authRoute;
