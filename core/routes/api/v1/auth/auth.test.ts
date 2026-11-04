import { describe, it, expect, beforeAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { getTestEnv } from '../../../../testEnv';
import { usersRepository } from '../../../../repositories/users.repository';

describe('POST /api/v1/auth/impersonate', () => {
    let app: FastifyInstance;
    let adminToken: string;
    let customerToken: string;
    let customerUserId: string;
    let adminUserId: string;

    beforeAll(async () => {
        const env = await getTestEnv();
        app = env.app;
        adminToken = env.adminToken!;
        customerToken = env.customerToken!;

        const customer = await usersRepository.findByUsername('customer');
        customerUserId = customer!.id;

        const admin = await usersRepository.findByUsername('admin');
        adminUserId = admin!.id;
    });

    it('should return 401 when no token is provided', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/impersonate',
            payload: { userId: customerUserId }
        });

        expect(response.statusCode).toBe(401);
    });

    it('should reject when a customer tries to impersonate', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/impersonate',
            headers: {
                authorization: `Bearer ${customerToken}`
            },
            payload: { userId: customerUserId }
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.payload);
        expect(body.message).toContain('Requires role: admin');
    });

    it('should return 404 when target user does not exist', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/impersonate',
            headers: {
                authorization: `Bearer ${adminToken}`
            },
            payload: { userId: '00000000-0000-0000-0000-000000000000' }
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.message).toContain('User not found');
    });

    it('should return 400 when attempting to impersonate an administrator', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/impersonate',
            headers: {
                authorization: `Bearer ${adminToken}`
            },
            payload: { userId: adminUserId }
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.message).toContain('Cannot impersonate an administrator');
    });

    it('should allow admin to impersonate a customer successfully', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/impersonate',
            headers: {
                authorization: `Bearer ${adminToken}`
            },
            payload: { userId: customerUserId }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toHaveProperty('accessToken');
        expect(body).toHaveProperty('refreshToken');
        expect(body.role).toBe('customer');
        expect(body.username).toBe('customer');
        expect(body.userId).toBe(customerUserId);

        // Verify the impersonated access token can access /api/v1/auth/me as the customer
        const meResponse = await app.inject({
            method: 'GET',
            url: '/api/v1/auth/me',
            headers: {
                authorization: `Bearer ${body.accessToken}`
            }
        });

        expect(meResponse.statusCode).toBe(200);
        const meBody = JSON.parse(meResponse.payload);
        expect(meBody.id).toBe(customerUserId);
        expect(meBody.role).toBe('customer');
    });
});
