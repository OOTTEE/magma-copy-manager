import { FastifyPluginAsync } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Info Route
 * 
 * Provides public metadata about the service.
 * Accessible without authentication.
 */
const infoRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      tags: ['System'],
      description: 'Get service metadata including version.',
      response: {
        200: {
          type: 'object',
          properties: {
            version: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Read package.json to get the version
      const pkgPath = join(process.cwd(), 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      
      return reply.send({ version: pkg.version || 'unknown' });
    } catch (error) {
      fastify.log.error(error);
      return reply.send({ version: '1.0.0' }); // Fallback
    }
  });
};

export default infoRoute;
