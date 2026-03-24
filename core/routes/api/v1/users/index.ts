import { FastifyPluginAsync, RouteShorthandOptions } from 'fastify';
import { copiesService } from '../../../../services/copies.service';

const schema: RouteShorthandOptions = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                from: { type: 'string', format: 'date' },
                to: { type: 'string', format: 'date' }
            }
        },
        response: {
            200: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        datetime: { type: 'string', format: 'date-time' },
                        count: {
                            type: 'object',
                            properties: {
                                "a4-color": { type: 'integer' },
                                "a4-bw": { type: 'integer' },
                                "a3-color": { type: 'integer' },
                                "a3-bw": { type: 'integer' },
                                "sra3-color": { type: 'integer' },
                                "sra3-bw": { type: 'integer' }
                            }
                        },
                        total: {
                            type: 'object',
                            properties: {
                                "a4-color": { type: 'integer' },
                                "a4-bw": { type: 'integer' },
                                "a3-color": { type: 'integer' },
                                "a3-bw": { type: 'integer' },
                                "sra3-color": { type: 'integer' },
                                "sra3-bw": { type: 'integer' }
                            }
                        },
                        _links: {
                            type: 'object',
                            properties: {
                                self: { type: 'string' },
                                user: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }
}

interface CopiesQuery {
    from?: string;
    to?: string;
}

interface CopiesParams {
    userId: string;
}

const userCopiesRoute: FastifyPluginAsync = async (fastify, opts) => {
    fastify.get<{ Params: CopiesParams, Querystring: CopiesQuery }>('/:userId/copies', schema, async (request, reply) => {
        const { userId } = request.params;
        const { from, to } = request.query;
        return await copiesService.getUserCopies(userId, from, to);
    })
}

export default userCopiesRoute;
