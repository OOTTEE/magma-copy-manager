import { describe, it, expect, beforeAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { getTestEnv } from '../../../../testEnv';
import { db } from '../../../../db';
import { syncLogs } from '../../../../db/schema';
import { randomUUID } from 'crypto';

describe('Automation API Endpoints', () => {
    let app: FastifyInstance;
    let adminToken: string;
    let customerToken: string;

    beforeAll(async () => {
        const env = await getTestEnv();
        app = env.app;
        adminToken = env.adminToken!;
        customerToken = env.customerToken!;

        // Seed sample sync logs for testing
        const sampleLogs = [
            {
                id: randomUUID(),
                datetime: '2026-11-01T02:00:00.000Z',
                status: 'success',
                triggerType: 'auto',
                processType: 'sync',
                summary: 'Sincronización completada. 2 usuarios actualizados.',
                details: JSON.stringify({
                    durationMs: 3100,
                    errors: [],
                    changed: [{ userId: 'user-1', username: 'testuser', delta: { total: 5, a4Bw: 5, a4Color: 0, a3Bw: 0, a3Color: 0 } }],
                    unchangedCount: 20
                })
            },
            {
                id: randomUUID(),
                datetime: '2026-11-01T02:30:00.000Z',
                status: 'failed',
                triggerType: 'manual',
                processType: 'sync',
                summary: 'Sincronización fallida: 1 incidencias.',
                details: JSON.stringify({
                    durationMs: 1200,
                    errors: [{ username: 'baduser', error: 'Printer unreachable' }],
                    changed: [],
                    unchangedCount: 21,
                    trace: 'Error: Connection timeout at printer'
                })
            },
            {
                id: randomUUID(),
                datetime: '2026-10-28T22:45:00.000Z',
                status: 'success',
                triggerType: 'auto',
                processType: 'billing',
                summary: 'Procesados 22 usuarios con éxito.',
                details: JSON.stringify({
                    durationMs: 5400,
                    errors: [],
                    changed: [{ userId: 'user-1', username: 'testuser', details: 'success (2 sales)' }],
                    unchangedCount: 21
                })
            }
        ];

        for (const log of sampleLogs) {
            await db.insert(syncLogs).values(log).run();
        }
    });

    it('GET /api/v1/automation/logs requires authentication', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/automation/logs'
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/v1/automation/logs rejects non-admin users', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/automation/logs',
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/v1/automation/logs returns paginated list for admin', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/automation/logs',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        const data = JSON.parse(res.payload);
        expect(data).toHaveProperty('pagination');
        expect(data).toHaveProperty('items');
        expect(Array.isArray(data.items)).toBe(true);
        expect(data.items.length).toBeGreaterThanOrEqual(3);

        const first = data.items[0];
        expect(first).toHaveProperty('id');
        expect(first).toHaveProperty('datetime');
        expect(first).toHaveProperty('status');
        expect(first).toHaveProperty('processType');
        expect(first).toHaveProperty('stats');
        expect(first).toHaveProperty('details');
    });

    it('GET /api/v1/automation/logs filters by status=failed', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/automation/logs?status=failed',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        const data = JSON.parse(res.payload);
        expect(data.items.every((item: any) => item.status === 'failed')).toBe(true);
    });

    it('GET /api/v1/automation/logs filters by processType=billing', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/automation/logs?processType=billing',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        const data = JSON.parse(res.payload);
        expect(data.items.every((item: any) => item.processType === 'billing')).toBe(true);
    });

    it('GET /api/v1/automation/periods returns available periods', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/v1/automation/periods',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        const data = JSON.parse(res.payload);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toHaveProperty('period');
        expect(data[0]).toHaveProperty('name');
    });
});
