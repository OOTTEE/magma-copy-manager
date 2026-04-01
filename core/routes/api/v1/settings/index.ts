import { FastifyPluginAsync } from 'fastify';
import { settingsService } from '../../../../services/settings/settings.service';

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
    const all = await settingsService.getAllSettings();
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
    const updates = request.body as Record<string, string>;

    for (const [key, value] of Object.entries(updates)) {
      // Validate Printer URL if present
      if (key === 'printer_url') {
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return reply.code(400).send({ message: 'Printer URL must start with http:// or https://' });
        }
      }

      // Validate Billing Cycle Day if present
      if (key === 'billing_cycle_day') {
        const day = parseInt(value, 10);
        if (isNaN(day) || day < 1 || day > 28) {
          return reply.code(400).send({ message: 'Billing cycle day must be between 1 and 28' });
        }
      }

      await settingsService.updateSetting(key, value);
    }

    return reply.code(204).send();
  });
};

export default settingsRoute;
