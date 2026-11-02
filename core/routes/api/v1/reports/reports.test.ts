import { describe, it, expect, beforeAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { getTestEnv } from '../../../../testEnv';

describe('Reports API Endpoints', () => {
    let app: FastifyInstance;
    let adminToken: string;
    let customerToken: string;

    beforeAll(async () => {
        const env = await getTestEnv();
        app = env.app;
        adminToken = env.adminToken!;
        customerToken = env.customerToken!;
    });

    it('GET /api/v1/reports/periods requires authentication', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/reports/periods'
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/v1/reports/periods rejects non-admin users', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/reports/periods',
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/v1/reports/periods returns periods list for admin', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/reports/periods',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        const data = JSON.parse(res.payload);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toHaveProperty('period');
        expect(data[0]).toHaveProperty('metrics');
        expect(data[0].metrics).toHaveProperty('totalCopies');
    });

    it('GET /api/v1/reports/monthly returns filtered monthly report', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/reports/monthly?filter=linked',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        const report = JSON.parse(res.payload);
        expect(report).toHaveProperty('period');
        expect(report).toHaveProperty('data');
        expect(Array.isArray(report.data)).toBe(true);
    });

    it('GET /api/v1/reports/orphans returns orphan list for admin', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/reports/orphans',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        const orphans = JSON.parse(res.payload);
        expect(Array.isArray(orphans)).toBe(true);
    });
});
