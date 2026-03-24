import { FastifyPluginAsync, FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify';
import { readCopiesService } from '../../../../services/read.copies.service';

const schema: RouteShorthandOptions = {
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                printUser: { type: 'string' },
                                nexudusUser: { type: 'string' },
                                copies: {
                                    type: 'object',
                                    properties: {
                                        "A4": { type: 'integer' },
                                        "A3": { type: 'integer' },
                                        "SRA3": { type: 'integer' },
                                        "Color": { type: 'integer' },
                                        "B&W": { type: 'integer' }
                                    }
                                },
                                total: { type: 'integer' },
                                from: { type: 'string', format: 'date-time' },
                                to: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                }
            }
        }
    }
}

const copies: FastifyPluginAsync = async (fastify, opts) => {
    fastify.get('/', schema, async (request: FastifyRequest, reply: FastifyReply) => {
        const result = await readCopiesService.listAll();
        return { data: result };
    })
}

export default copies;
