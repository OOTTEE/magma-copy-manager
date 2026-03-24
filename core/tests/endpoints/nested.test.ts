import { describe, it, expect, beforeAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { getTestEnv } from '../testEnv';

describe('Nested Resources API', () => {
    let app: FastifyInstance;
    let adminToken: string;
    let customerToken: string;

    beforeAll(async () => {
        const env = await getTestEnv();
        app = env.app;
        adminToken = env.adminToken!;
        customerToken = env.customerToken!;
    });

    describe('Copies', () => {
        it('should get copies for user', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/admin/copies',
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.payload);
            expect(Array.isArray(data)).toBe(true);
        });

        it('should require auth for creating copies', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/users/admin/copies',
                payload: { datetime: '2023-10-01' },
                // Notice we DON'T pass the admin token here, so it should be 401
            });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('Invoices', () => {
        it('should get all invoices', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/admin/invoices',
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            expect(response.statusCode).toBe(200);
            const data = JSON.parse(response.payload);
            expect(Array.isArray(data)).toBe(true);
        });

        it('should return 404 for non-existing invoice', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/users/user123/invoices/inv-not-found',
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            expect(response.statusCode).toBe(404);
        });
    });
});
