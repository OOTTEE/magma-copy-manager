---
name: endpoint-developer
description: Helps to develop endpoints for the backend application using Node + TypeScript + Fastify + OpenAPI + Drizzle + SQLite + Nexudus API client
---

# Rules
- The endpoint will be added to the backend application
- The endpoint will be added to the OpenAPI specification
- The endpoint will be added to in 'core/routes' folder

# Router GET example
```TypeScript
import {FastifyPluginAsync, FastifyReply, FastifyRequest, RouteShorthandOptions} from 'fastify'
import {readCopiesService} from "../../services/read.copies.service";

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
                                printUser: {type: 'string'},
                                nexudusUser: {type: 'string'},
                                copies: {
                                    type: 'object',
                                    properties: {
                                        "A4": {type: 'integer'},
                                        "A3": {type: 'integer'},
                                        "A3+": {type: 'integer'}
                                    }
                                },
                                total: {type: 'integer'},
                                from: {type: 'string', format: 'date-time'},
                                to: {type: 'string', format: 'date-time'}
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
        return await readCopiesService.listAll();
    })
}

export default copies
```


