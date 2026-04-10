import { describe, it, expect, beforeAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { getTestEnv } from '../../../../testEnv';

describe('POST /api/v1/login', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        const env = await getTestEnv();
        app = env.app;
    });

    it('should return 401 for invalid credentials', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/login',
            payload: {
                username: 'wronguser',
                password: 'wrongpassword'
            }
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.payload);
        expect(body).toHaveProperty('error_type', 'unauthorized');
    });

    it('should return token for valid credentials', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/login',
            payload: {
                username: 'admin',
                password: 'adminPassword'
            }
        });
        
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toHaveProperty('accessToken');
        expect(typeof body.accessToken).toBe('string');
    });
});
