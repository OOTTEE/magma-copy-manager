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
            role: { type: 'string' },
            username: { type: 'string' }
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

  /**
   * POST /api/v1/auth/impersonate
   * Allows an admin to impersonate a customer without credentials.
   */
  fastify.post('/impersonate', {
    schema: {
      tags: ['Auth'],
      description: 'Allows an administrator to impersonate a customer without credentials.',
      body: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            role: { type: 'string' },
            username: { type: 'string' },
            userId: { type: 'string' }
          }
        },
        400: { type: 'object', properties: { message: { type: 'string' } } },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } },
        404: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const requestingUser = request.user as { id: string; role: string };
    const { userId } = request.body as { userId: string };

    try {
      const result = await authFacade.impersonateUser(fastify, requestingUser, userId);
      return reply.send(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.code(statusCode).send({
        message: err.message || 'Error executing impersonation'
      });
    }
  });

  /**
   * POST /api/v1/auth/recovery
   * Requests a one-time recovery link sent to user email (anti-enumeration).
   */
  fastify.post('/recovery', {
    schema: {
      tags: ['Auth'],
      description: 'Requests a one-time magic link sent to user email for recovery and unlocking.',
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { username } = request.body as { username: string };
    const origin = request.headers.origin || (request.headers.referer ? new URL(request.headers.referer).origin : undefined);
    const result = await authFacade.requestRecovery(username, origin);
    return reply.send(result);
  });

  /**
   * POST /api/v1/auth/recovery/verify
   * Verifies a recovery magic link, unlocks the account, and issues session tokens.
   */
  fastify.post('/recovery/verify', {
    schema: {
      tags: ['Auth'],
      description: 'Verifies a recovery link, unlocks account, and returns authenticated session.',
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            role: { type: 'string' },
            username: { type: 'string' },
            userId: { type: 'string' },
            mustResetPassword: { type: 'boolean' }
          }
        },
        400: { type: 'object', properties: { message: { type: 'string' } } },
        404: { type: 'object', properties: { message: { type: 'string' } } }
      }
    }
  }, async (request, reply) => {
    const { token } = request.body as { token: string };
    try {
      const result = await authFacade.verifyRecoveryToken(fastify, token);
      return reply.send(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      return reply.code(statusCode).send({
        message: err.message || 'El enlace de acceso es inválido o ha caducado.'
      });
    }
  });

  /**
   * POST /api/v1/auth/reset-password
   * Authenticated endpoint to change password and clear security lockout.
   */
  fastify.post('/reset-password', {
    schema: {
      tags: ['Auth'],
      description: 'Updates current authenticated user password.',
      body: {
        type: 'object',
        required: ['newPassword'],
        properties: {
          newPassword: { type: 'string', minLength: 8 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: { type: 'object', properties: { message: { type: 'string' } } },
        401: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as { id: string };
    const { newPassword } = request.body as { newPassword: string };

    try {
      const result = await authFacade.resetPassword(user.id, newPassword);
      return reply.send(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      return reply.code(statusCode).send({
        message: err.message || 'Error al actualizar la contraseña'
      });
    }
  });
};

export default authRoute;
