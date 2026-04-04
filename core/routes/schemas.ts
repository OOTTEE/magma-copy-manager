/**
 * Shared JSON Schemas for the Magma API.
 * These schemas help homogenize responses and requests across different endpoints.
 */

export const errorSchema = {
    type: 'object',
    properties: {
        trace_id: { type: 'string' },
        error_type: { type: 'string' },
        message: { type: 'string' }
    }
};

export const copiesCountSchema = {
    type: 'object',
    properties: {
        a4Color: { type: 'number' },
        a4Bw: { type: 'number' },
        a3Color: { type: 'number' },
        a3Bw: { type: 'number' }
    }
};

export const copySchema = {
    type: 'object',
    properties: {
        datetime: { type: 'string', format: 'date-time' },
        count: copiesCountSchema,
        total: copiesCountSchema,
        _links: {
            type: 'object',
            properties: {
                self: { type: 'string' },
                user: { type: 'string' }
            }
        }
    }
};

export const userSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        username: { type: 'string' },
        role: { type: 'string', enum: ['admin', 'customer'] },
        printUser: { type: 'string' },
        nexudusUser: { type: 'string' },
        _links: {
            type: 'object',
            properties: {
                self: { type: 'string' },
                copies: { type: 'string' },
                invoices: { type: 'string' }
            }
        }
    }
};

export const loginResponseSchema = {
    type: 'object',
    properties: {
        token: { type: 'string' }
    }
};

export const syncResponseSchema = {
    type: 'object',
    properties: {
        status: { type: 'string', enum: ['success', 'partial_success', 'error'] },
        syncedCount: { type: 'number' },
        errors: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    user: { type: 'string' },
                    message: { type: 'string' }
                }
            }
        },
        reportPath: { type: 'string' }
    }
};

export const paginationSchema = {
    type: 'object',
    properties: {
        total_records: { type: 'integer' },
        current_page: { type: 'integer' },
        total_pages: { type: 'integer' },
        limit: { type: 'integer' }
    }
};
