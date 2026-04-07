import { describe, it, expect, beforeAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { getTestEnv } from '../../../../../testEnv';

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
    });
});
