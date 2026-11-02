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

    it('should update user isIgnored status bidirectionally', async () => {
        // 1. Get first user
        const listRes = await app.inject({
            method: 'GET',
            url: '/api/v1/users',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const users = JSON.parse(listRes.payload);
        const targetUser = users[0];
        expect(targetUser).toBeDefined();

        // 2. Set isIgnored: 1
        const patchRes1 = await app.inject({
            method: 'PATCH',
            url: `/api/v1/users/${targetUser.id}`,
            headers: { Authorization: `Bearer ${adminToken}` },
            payload: { isIgnored: 1 }
        });
        expect(patchRes1.statusCode).toBe(200);
        const updated1 = JSON.parse(patchRes1.payload);
        expect(updated1.isIgnored).toBe(1);

        // 3. Revert isIgnored: 0
        const patchRes2 = await app.inject({
            method: 'PATCH',
            url: `/api/v1/users/${targetUser.id}`,
            headers: { Authorization: `Bearer ${adminToken}` },
            payload: { isIgnored: 0 }
        });
        expect(patchRes2.statusCode).toBe(200);
        const updated2 = JSON.parse(patchRes2.payload);
        expect(updated2.isIgnored).toBe(0);
    });
});
