import { FastifyPluginAsync } from 'fastify';
import { settingsFacade } from '../../../../facades/settings/settings.facade';

const settingsRoute: FastifyPluginAsync = async (fastify) => {
  // GET all settings
  fastify.get('/', {
    schema: {
      tags: ['Settings'],
      description: 'Get all system settings.',
      response: {
        200: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        401: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const all = await settingsFacade.getAllSettings(user);
    return reply.send(all);
  });

  // PATCH settings
  fastify.patch('/', {
    schema: {
      tags: ['Settings'],
      description: 'Update one or more system settings.',
      body: {
        type: 'object',
        additionalProperties: { type: 'string' }
      },
      response: {
        204: { type: 'null' },
        400: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    const updates = request.body as Record<string, string>;

    try {
      await settingsFacade.updateSettings(user, updates);
      return reply.code(204).send();
    } catch (error: any) {
      if (error.statusCode === 400) {
        return reply.code(400).send({ message: error.message });
      }
      throw error;
    }
  });

  // POST test-email
  fastify.post('/test-email', {
    schema: {
      tags: ['Settings'],
      description: 'Send a test email to verify SMTP configuration.',
      response: {
        200: { type: 'object', properties: { message: { type: 'string' } } },
        400: { type: 'object', properties: { message: { type: 'string' } } },
        403: { type: 'object', properties: { message: { type: 'string' } } }
      }
    },
    preValidation: [fastify.authenticate, fastify.requireRole('admin')]
  }, async (request, reply) => {
    const user = request.user as { id: string; role: string };
    try {
      await settingsFacade.testEmailConnection(user);
      return reply.send({ message: 'Test email sent successfully.' });
    } catch (error: any) {
      return reply.code(400).send({ message: error.message });
    }
  });
};

export default settingsRoute;
