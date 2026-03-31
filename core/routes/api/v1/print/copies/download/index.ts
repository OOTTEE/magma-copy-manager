import '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify';
import { printerScraperService } from '../../../../../../services/printer.scraper.service';

const downloadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', {
    schema: {
      tags: ['Printer'],
      description: 'Trigger the printer scraper to download the monthly copies CSV file physically to the backend server.',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            path: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const downloadPath = await printerScraperService.downloadMonthlyCopies();
      return reply.send({ success: true, path: downloadPath });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ success: false, error: error.message || 'Scraper encountered an error' });
    }
  });
};

export default downloadRoute;
