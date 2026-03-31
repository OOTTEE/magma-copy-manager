import { describe, it, expect, beforeAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { getTestEnv } from '../../../../testEnv';

describe('Users API', () => {
    let app: FastifyInstance;
    let adminToken: string;

    beforeAll(async () => {
        const env = await getTestEnv();
        app = env.app;
        adminToken = env.adminToken!;
    });

    it('should return 401 on protected routes without token', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/users',
            payload: {}
        });

        // Fastify authenticate decorator usually returns 401 if unauthorized
        expect(response.statusCode).toBe(401);
    });

    it('should get all users', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/users',
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        expect(response.statusCode).toBe(200);
        const users = JSON.parse(response.payload);
        expect(Array.isArray(users)).toBe(true);
    });
});
